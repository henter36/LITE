import { Router } from "express";
import { db } from "@workspace/db";
import { brandStrategiesTable, brandProfilesTable, auditLogsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";
import { getBrandStrategyAIProvider, MockBrandStrategyProvider } from "../lib/ai-provider";

const router = Router();

function serializeStrategy(s: typeof brandStrategiesTable.$inferSelect) {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    brandProfileId: s.brandProfileId,
    generatedByUserId: s.generatedByUserId,
    status: s.status,
    source: s.source,
    strategySummary: s.strategySummary,
    positioning: s.positioning,
    idealCustomerProfile: s.idealCustomerProfile,
    primaryAudience: s.primaryAudience,
    secondaryAudience: s.secondaryAudience,
    keyMessages: JSON.parse(s.keyMessages || "[]"),
    valueProposition: s.valueProposition,
    contentPillars: JSON.parse(s.contentPillars || "[]"),
    channelStrategy: JSON.parse(s.channelStrategy || "[]"),
    toneGuidelines: s.toneGuidelines,
    ctaGuidelines: s.ctaGuidelines,
    forbiddenClaims: JSON.parse(s.forbiddenClaims || "[]"),
    riskNotes: JSON.parse(s.riskNotes || "[]"),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/brand-strategy", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const role = await getMemberRole(req.session.userId!, workspaceId);
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  const [current] = await db
    .select()
    .from(brandStrategiesTable)
    .where(
      and(
        eq(brandStrategiesTable.workspaceId, workspaceId),
        eq(brandStrategiesTable.status, "current"),
      ),
    )
    .orderBy(desc(brandStrategiesTable.updatedAt));
  if (!current) {
    res.status(404).json({ error: "No current brand strategy found" });
    return;
  }
  res.json(serializeStrategy(current));
});

router.post("/brand-strategy/generate", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId } = req.body;
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const role = await getMemberRole(req.session.userId!, workspaceId);
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (!hasMinRole(role, "editor")) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }

  const [brandProfile] = await db
    .select()
    .from(brandProfilesTable)
    .where(eq(brandProfilesTable.workspaceId, workspaceId))
    .orderBy(desc(brandProfilesTable.createdAt));

  if (!brandProfile) {
    res.status(400).json({ error: "Brand profile must be created before generating brand strategy" });
    return;
  }

  const { provider, selectedProvider, keyMissing } = getBrandStrategyAIProvider();

  if (keyMissing) {
    const mock = new MockBrandStrategyProvider();
    const draft = await mock.generateBrandStrategy({
      brandName: brandProfile.brandName,
      productsServices: brandProfile.productsServices,
      targetAudience: brandProfile.targetAudience,
      toneOfVoice: brandProfile.toneOfVoice,
      preferredChannels: JSON.parse(brandProfile.preferredChannels || "[]"),
      forbiddenClaims: brandProfile.forbiddenClaims,
      visualNotes: brandProfile.visualNotes,
    });
    res.status(503).json({
      error: "AI is unavailable until OPENAI_API_KEY is configured",
      code: "AI_UNAVAILABLE",
      draft,
      source: "unavailable",
    });
    return;
  }

  const input = {
    brandName: brandProfile.brandName,
    productsServices: brandProfile.productsServices,
    targetAudience: brandProfile.targetAudience,
    toneOfVoice: brandProfile.toneOfVoice,
    preferredChannels: JSON.parse(brandProfile.preferredChannels || "[]"),
    forbiddenClaims: brandProfile.forbiddenClaims,
    visualNotes: brandProfile.visualNotes,
    userProvidedAnswers: req.body.userProvidedAnswers ?? "",
  };

  let output: Awaited<ReturnType<typeof provider!.generateBrandStrategy>>;
  let usedSource: "real" | "mock" = selectedProvider === "openai" ? "real" : "mock";

  try {
    output = await provider!.generateBrandStrategy(input);
  } catch (err) {
    req.log?.warn({ err }, "OpenAI brand strategy generation failed — falling back to mock");
    const mock = new MockBrandStrategyProvider();
    output = await mock.generateBrandStrategy(input);
    usedSource = "mock";
  }

  await db
    .update(brandStrategiesTable)
    .set({ status: "archived" })
    .where(
      and(
        eq(brandStrategiesTable.workspaceId, workspaceId),
        eq(brandStrategiesTable.status, "current"),
      ),
    );

  const [saved] = await db
    .insert(brandStrategiesTable)
    .values({
      workspaceId,
      brandProfileId: brandProfile.id,
      generatedByUserId: req.session.userId!,
      status: "current",
      source: usedSource,
      strategySummary: output.strategySummary,
      positioning: output.positioning,
      idealCustomerProfile: output.idealCustomerProfile,
      primaryAudience: output.primaryAudience,
      secondaryAudience: output.secondaryAudience,
      keyMessages: JSON.stringify(output.keyMessages),
      valueProposition: output.valueProposition,
      contentPillars: JSON.stringify(output.contentPillars),
      channelStrategy: JSON.stringify(output.channelStrategy),
      toneGuidelines: output.toneGuidelines,
      ctaGuidelines: output.ctaGuidelines,
      forbiddenClaims: JSON.stringify(output.forbiddenClaims),
      riskNotes: JSON.stringify(output.riskNotes),
    })
    .returning();

  await db.insert(auditLogsTable).values({
    workspaceId,
    action: "brand_strategy_generated",
    entityType: "brand_strategy",
    entityId: saved.id,
    actor: actor(req),
    details: `Brand strategy generated for "${brandProfile.brandName}" (source: ${usedSource})`,
  });

  res.status(201).json({ ...serializeStrategy(saved), source: usedSource });
});

router.put("/brand-strategy/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [existing] = await db
    .select()
    .from(brandStrategiesTable)
    .where(eq(brandStrategiesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const role = await getMemberRole(req.session.userId!, existing.workspaceId);
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (!hasMinRole(role, "editor")) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }

  const {
    strategySummary, positioning, idealCustomerProfile, primaryAudience, secondaryAudience,
    keyMessages, valueProposition, contentPillars, channelStrategy,
    toneGuidelines, ctaGuidelines, forbiddenClaims, riskNotes,
  } = req.body;

  const [updated] = await db
    .update(brandStrategiesTable)
    .set({
      strategySummary: strategySummary ?? existing.strategySummary,
      positioning: positioning ?? existing.positioning,
      idealCustomerProfile: idealCustomerProfile ?? existing.idealCustomerProfile,
      primaryAudience: primaryAudience ?? existing.primaryAudience,
      secondaryAudience: secondaryAudience ?? existing.secondaryAudience,
      keyMessages: keyMessages ? JSON.stringify(keyMessages) : existing.keyMessages,
      valueProposition: valueProposition ?? existing.valueProposition,
      contentPillars: contentPillars ? JSON.stringify(contentPillars) : existing.contentPillars,
      channelStrategy: channelStrategy ? JSON.stringify(channelStrategy) : existing.channelStrategy,
      toneGuidelines: toneGuidelines ?? existing.toneGuidelines,
      ctaGuidelines: ctaGuidelines ?? existing.ctaGuidelines,
      forbiddenClaims: forbiddenClaims ? JSON.stringify(forbiddenClaims) : existing.forbiddenClaims,
      riskNotes: riskNotes ? JSON.stringify(riskNotes) : existing.riskNotes,
      updatedAt: new Date(),
    })
    .where(eq(brandStrategiesTable.id, id))
    .returning();

  await db.insert(auditLogsTable).values({
    workspaceId: existing.workspaceId,
    action: "brand_strategy_updated",
    entityType: "brand_strategy",
    entityId: id,
    actor: actor(req),
    details: "Brand strategy manually updated",
  });

  res.json(serializeStrategy(updated));
});

export default router;
