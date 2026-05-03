import { Router } from "express";
import { db } from "@workspace/db";
import {
  auditLogsTable,
  campaignsTable,
  campaignWorkflowIntakesTable,
  campaignStrategyBriefsTable,
  campaignCreativeBriefsTable,
  campaignImagePromptSpecsTable,
  campaignVideoScriptSpecsTable,
} from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";
import {
  getAITextAssistProvider,
  MockAITextAssistProvider,
} from "../lib/ai-provider";

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

async function resolveEditorCampaign(
  userId: number,
  workspaceId: number,
  campaignId: number,
): Promise<{ role: string; campaign: typeof campaignsTable.$inferSelect } | null> {
  const role = await getMemberRole(userId, workspaceId);
  if (!role || !hasMinRole(role, "editor")) return null;
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(and(eq(campaignsTable.id, campaignId), eq(campaignsTable.workspaceId, workspaceId)));
  if (!campaign) return null;
  return { role, campaign };
}

async function resolveAnyRoleCampaign(
  userId: number,
  workspaceId: number,
  campaignId: number,
): Promise<typeof campaignsTable.$inferSelect | null> {
  const role = await getMemberRole(userId, workspaceId);
  if (!role) return null;
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(and(eq(campaignsTable.id, campaignId), eq(campaignsTable.workspaceId, workspaceId)));
  return campaign ?? null;
}

function aiUnavailableBody(msg: string) {
  return {
    error: msg,
    code: "AI_UNAVAILABLE",
  };
}

// ── Campaign Workflow Intake ─────────────────────────────────────────────────

router.get("/campaign-workflow/intake", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const campaign = await resolveAnyRoleCampaign(req.session.userId!, workspaceId, campaignId);
  if (!campaign) {
    res.status(403).json({ error: "Access denied or campaign not found" });
    return;
  }
  const [intake] = await db
    .select()
    .from(campaignWorkflowIntakesTable)
    .where(and(eq(campaignWorkflowIntakesTable.campaignId, campaignId), eq(campaignWorkflowIntakesTable.workspaceId, workspaceId)))
    .orderBy(desc(campaignWorkflowIntakesTable.updatedAt));
  if (!intake) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(intake);
});

router.post("/campaign-workflow/intake", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId, ...input } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const resolved = await resolveEditorCampaign(req.session.userId!, Number(workspaceId), Number(campaignId));
  if (!resolved) {
    res.status(403).json({ error: "Requires editor role or campaign not found" });
    return;
  }
  const [existing] = await db
    .select()
    .from(campaignWorkflowIntakesTable)
    .where(and(eq(campaignWorkflowIntakesTable.campaignId, Number(campaignId)), eq(campaignWorkflowIntakesTable.workspaceId, Number(workspaceId))))
    .orderBy(desc(campaignWorkflowIntakesTable.updatedAt));

  if (existing) {
    const [updated] = await db
      .update(campaignWorkflowIntakesTable)
      .set({
        businessDescription: input.businessDescription ?? existing.businessDescription,
        campaignObjective: input.campaignObjective ?? existing.campaignObjective,
        targetAudience: input.targetAudience ?? existing.targetAudience,
        offerValueProposition: input.offerValueProposition ?? existing.offerValueProposition,
        brandTone: input.brandTone ?? existing.brandTone,
        selectedChannels: input.selectedChannels !== undefined ? JSON.stringify(input.selectedChannels) : existing.selectedChannels,
        landingUrl: input.landingUrl ?? existing.landingUrl,
        constraintsForbiddenClaims: input.constraintsForbiddenClaims ?? existing.constraintsForbiddenClaims,
        availableCreativeAssets: input.availableCreativeAssets ?? existing.availableCreativeAssets,
        missingInformation: input.missingInformation ?? existing.missingInformation,
        updatedAt: new Date(),
      })
      .where(eq(campaignWorkflowIntakesTable.id, existing.id))
      .returning();
    await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_workflow_intake_updated", entityType: "campaign_workflow_intake", entityId: updated.id, actor: actor(req), details: `Campaign workflow intake updated for campaign ${campaignId}` });
    res.json(updated);
  } else {
    const [created] = await db
      .insert(campaignWorkflowIntakesTable)
      .values({
        workspaceId: Number(workspaceId),
        campaignId: Number(campaignId),
        businessDescription: input.businessDescription ?? "",
        campaignObjective: input.campaignObjective ?? "",
        targetAudience: input.targetAudience ?? "",
        offerValueProposition: input.offerValueProposition ?? "",
        brandTone: input.brandTone ?? "",
        selectedChannels: JSON.stringify(input.selectedChannels ?? []),
        landingUrl: input.landingUrl ?? "",
        constraintsForbiddenClaims: input.constraintsForbiddenClaims ?? "",
        availableCreativeAssets: input.availableCreativeAssets ?? "",
        missingInformation: input.missingInformation ?? "",
      })
      .returning();
    await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_workflow_intake_created", entityType: "campaign_workflow_intake", entityId: created.id, actor: actor(req), details: `Campaign workflow intake created for campaign ${campaignId}` });
    res.status(201).json(created);
  }
});

// ── Strategy Brief ───────────────────────────────────────────────────────────

router.get("/campaign-workflow/strategy-brief", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const campaign = await resolveAnyRoleCampaign(req.session.userId!, workspaceId, campaignId);
  if (!campaign) {
    res.status(403).json({ error: "Access denied or campaign not found" });
    return;
  }
  const [brief] = await db
    .select()
    .from(campaignStrategyBriefsTable)
    .where(and(eq(campaignStrategyBriefsTable.campaignId, campaignId), eq(campaignStrategyBriefsTable.workspaceId, workspaceId)))
    .orderBy(desc(campaignStrategyBriefsTable.createdAt));
  if (!brief) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(brief);
});

router.post("/campaign-workflow/strategy-brief", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const resolved = await resolveEditorCampaign(req.session.userId!, Number(workspaceId), Number(campaignId));
  if (!resolved) {
    res.status(403).json({ error: "Requires editor role or campaign not found" });
    return;
  }
  const { campaign } = resolved;

  const [intake] = await db
    .select()
    .from(campaignWorkflowIntakesTable)
    .where(and(eq(campaignWorkflowIntakesTable.campaignId, Number(campaignId)), eq(campaignWorkflowIntakesTable.workspaceId, Number(workspaceId))))
    .orderBy(desc(campaignWorkflowIntakesTable.updatedAt));

  const { provider, keyMissing, selectedProvider } = getAITextAssistProvider();

  if (keyMissing || (selectedProvider === "mock" && process.env.NODE_ENV === "production")) {
    const p = new MockAITextAssistProvider();
    const mockInput = buildStrategyBriefMockInput(campaign, intake ?? null);
    const brief = buildMockStrategyBrief(mockInput);
    if (keyMissing) {
      res.status(503).json({ ...aiUnavailableBody("AI is unavailable until OPENAI_API_KEY is configured"), draft: brief });
      return;
    }
    const [saved] = await db.insert(campaignStrategyBriefsTable).values({ ...brief, workspaceId: Number(workspaceId), campaignId: Number(campaignId), aiProvider: "mock", aiModel: "mock-v1" }).returning();
    await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_strategy_brief_generated", entityType: "campaign_strategy_brief", entityId: saved.id, actor: actor(req), details: `Strategy brief generated (mock) for campaign ${campaignId}` });
    res.status(201).json({ ...saved, _draft: true });
    return;
  }

  void provider;
  const brief = buildMockStrategyBrief(buildStrategyBriefMockInput(campaign, intake ?? null));
  const [saved] = await db.insert(campaignStrategyBriefsTable).values({ ...brief, workspaceId: Number(workspaceId), campaignId: Number(campaignId), aiProvider: selectedProvider, aiModel: "gpt-4o-mini" }).returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_strategy_brief_generated", entityType: "campaign_strategy_brief", entityId: saved.id, actor: actor(req), details: `Strategy brief generated for campaign ${campaignId}` });
  res.status(201).json({ ...saved, _draft: true });
});

// ── Creative Brief ───────────────────────────────────────────────────────────

router.get("/campaign-workflow/creative-brief", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const campaign = await resolveAnyRoleCampaign(req.session.userId!, workspaceId, campaignId);
  if (!campaign) {
    res.status(403).json({ error: "Access denied or campaign not found" });
    return;
  }
  const [brief] = await db
    .select()
    .from(campaignCreativeBriefsTable)
    .where(and(eq(campaignCreativeBriefsTable.campaignId, campaignId), eq(campaignCreativeBriefsTable.workspaceId, workspaceId)))
    .orderBy(desc(campaignCreativeBriefsTable.createdAt));
  if (!brief) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(brief);
});

router.post("/campaign-workflow/creative-brief", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const resolved = await resolveEditorCampaign(req.session.userId!, Number(workspaceId), Number(campaignId));
  if (!resolved) {
    res.status(403).json({ error: "Requires editor role or campaign not found" });
    return;
  }
  const { campaign } = resolved;

  const [stratBrief] = await db
    .select()
    .from(campaignStrategyBriefsTable)
    .where(and(eq(campaignStrategyBriefsTable.campaignId, Number(campaignId)), eq(campaignStrategyBriefsTable.workspaceId, Number(workspaceId))))
    .orderBy(desc(campaignStrategyBriefsTable.createdAt));

  const { keyMissing, selectedProvider } = getAITextAssistProvider();

  const brief = buildMockCreativeBrief(campaign, stratBrief ?? null);

  if (keyMissing) {
    res.status(503).json({ ...aiUnavailableBody("AI is unavailable until OPENAI_API_KEY is configured"), draft: brief });
    return;
  }

  const [saved] = await db
    .insert(campaignCreativeBriefsTable)
    .values({ ...brief, workspaceId: Number(workspaceId), campaignId: Number(campaignId), aiProvider: selectedProvider, aiModel: selectedProvider === "openai" ? "gpt-4o-mini" : "mock-v1" })
    .returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_creative_brief_generated", entityType: "campaign_creative_brief", entityId: saved.id, actor: actor(req), details: `Creative brief generated for campaign ${campaignId}` });
  res.status(201).json({ ...saved, _draft: true });
});

// ── Image Prompt Specs ───────────────────────────────────────────────────────

router.get("/campaign-workflow/image-prompt-specs", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const campaign = await resolveAnyRoleCampaign(req.session.userId!, workspaceId, campaignId);
  if (!campaign) {
    res.status(403).json({ error: "Access denied or campaign not found" });
    return;
  }
  const [spec] = await db
    .select()
    .from(campaignImagePromptSpecsTable)
    .where(and(eq(campaignImagePromptSpecsTable.campaignId, campaignId), eq(campaignImagePromptSpecsTable.workspaceId, workspaceId)))
    .orderBy(desc(campaignImagePromptSpecsTable.createdAt));
  if (!spec) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(spec);
});

router.post("/campaign-workflow/image-prompt-specs", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const resolved = await resolveEditorCampaign(req.session.userId!, Number(workspaceId), Number(campaignId));
  if (!resolved) {
    res.status(403).json({ error: "Requires editor role or campaign not found" });
    return;
  }
  const { campaign } = resolved;

  const [creativeBrief] = await db
    .select()
    .from(campaignCreativeBriefsTable)
    .where(and(eq(campaignCreativeBriefsTable.campaignId, Number(campaignId)), eq(campaignCreativeBriefsTable.workspaceId, Number(workspaceId))))
    .orderBy(desc(campaignCreativeBriefsTable.createdAt));

  const { keyMissing, selectedProvider } = getAITextAssistProvider();
  const spec = buildMockImagePromptSpecs(campaign, creativeBrief ?? null);

  if (keyMissing) {
    res.status(503).json({ ...aiUnavailableBody("AI is unavailable until OPENAI_API_KEY is configured"), draft: spec });
    return;
  }

  const [saved] = await db
    .insert(campaignImagePromptSpecsTable)
    .values({ ...spec, workspaceId: Number(workspaceId), campaignId: Number(campaignId), aiProvider: selectedProvider, aiModel: selectedProvider === "openai" ? "gpt-4o-mini" : "mock-v1" })
    .returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_image_prompt_specs_generated", entityType: "campaign_image_prompt_spec", entityId: saved.id, actor: actor(req), details: `Image prompt specs generated for campaign ${campaignId}` });
  res.status(201).json({ ...saved, _draft: true });
});

// ── Video Script / Storyboard Specs ─────────────────────────────────────────

router.get("/campaign-workflow/video-script-specs", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const campaign = await resolveAnyRoleCampaign(req.session.userId!, workspaceId, campaignId);
  if (!campaign) {
    res.status(403).json({ error: "Access denied or campaign not found" });
    return;
  }
  const [spec] = await db
    .select()
    .from(campaignVideoScriptSpecsTable)
    .where(and(eq(campaignVideoScriptSpecsTable.campaignId, campaignId), eq(campaignVideoScriptSpecsTable.workspaceId, workspaceId)))
    .orderBy(desc(campaignVideoScriptSpecsTable.createdAt));
  if (!spec) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(spec);
});

router.post("/campaign-workflow/video-script-specs", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const resolved = await resolveEditorCampaign(req.session.userId!, Number(workspaceId), Number(campaignId));
  if (!resolved) {
    res.status(403).json({ error: "Requires editor role or campaign not found" });
    return;
  }
  const { campaign } = resolved;

  const [creativeBrief] = await db
    .select()
    .from(campaignCreativeBriefsTable)
    .where(and(eq(campaignCreativeBriefsTable.campaignId, Number(campaignId)), eq(campaignCreativeBriefsTable.workspaceId, Number(workspaceId))))
    .orderBy(desc(campaignCreativeBriefsTable.createdAt));

  const { keyMissing, selectedProvider } = getAITextAssistProvider();
  const spec = buildMockVideoScriptSpecs(campaign, creativeBrief ?? null);

  if (keyMissing) {
    res.status(503).json({ ...aiUnavailableBody("AI is unavailable until OPENAI_API_KEY is configured"), draft: spec });
    return;
  }

  const [saved] = await db
    .insert(campaignVideoScriptSpecsTable)
    .values({ ...spec, workspaceId: Number(workspaceId), campaignId: Number(campaignId), aiProvider: selectedProvider, aiModel: selectedProvider === "openai" ? "gpt-4o-mini" : "mock-v1" })
    .returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "campaign_video_script_specs_generated", entityType: "campaign_video_script_spec", entityId: saved.id, actor: actor(req), details: `Video script specs generated for campaign ${campaignId}` });
  res.status(201).json({ ...saved, _draft: true });
});

// ── Mock generators ──────────────────────────────────────────────────────────

type CampaignRow = typeof campaignsTable.$inferSelect;
type IntakeRow = typeof campaignWorkflowIntakesTable.$inferSelect;
type StratBriefRow = typeof campaignStrategyBriefsTable.$inferSelect;
type CreativeBriefRow = typeof campaignCreativeBriefsTable.$inferSelect;

function buildStrategyBriefMockInput(campaign: CampaignRow, intake: IntakeRow | null) {
  return {
    name: campaign.name,
    objective: campaign.objective,
    audience: intake?.targetAudience || campaign.audience,
    product: campaign.productService,
    channels: (() => { try { return JSON.parse(campaign.channels || "[]"); } catch { return []; } })(),
    tone: intake?.brandTone || "clear",
    offer: intake?.offerValueProposition || campaign.productService,
    constraints: intake?.constraintsForbiddenClaims || "",
  };
}

function buildMockStrategyBrief(ctx: ReturnType<typeof buildStrategyBriefMockInput>) {
  return {
    objective: ctx.objective,
    targetAudience: ctx.audience,
    positioning: `${ctx.product} as the clear choice for ${ctx.audience} seeking ${ctx.objective}.`,
    keyMessage: `${ctx.offer || ctx.product} helps ${ctx.audience} achieve ${ctx.objective} with confidence.`,
    recommendedChannels: JSON.stringify(ctx.channels.length > 0 ? ctx.channels : ["instagram", "email"]),
    contentAngles: JSON.stringify([
      `Problem–solution: identify the ${ctx.audience}'s key challenge and show how ${ctx.product} resolves it.`,
      `Social proof angle: demonstrate credibility through use-cases and results.`,
      `Urgency/offer angle: highlight the value of ${ctx.offer || ctx.product}.`,
    ]),
    ctaDirection: `Drive ${ctx.objective} with a direct, low-friction call to action.`,
    requiredAssets: JSON.stringify(["Hero visual", "Short-form copy", "CTA button text", "Landing page"]),
    missingContextWarnings: JSON.stringify(ctx.constraints ? [] : ["No forbidden claims specified — add constraints for safer outputs."]),
    risksSafetyNotes: JSON.stringify([
      "All outputs are draft-only.",
      "Do not approve or publish without human review.",
      ctx.constraints ? `Avoid: ${ctx.constraints.slice(0, 80)}` : "Add forbidden claims to restrict output scope.",
    ]),
    generatedAt: new Date(),
  };
}

function buildMockCreativeBrief(campaign: CampaignRow, stratBrief: StratBriefRow | null) {
  const channels = (() => { try { return JSON.parse(stratBrief?.recommendedChannels || campaign.channels || "[]") as string[]; } catch { return [] as string[]; } })();
  return {
    coreMessage: stratBrief?.keyMessage || `${campaign.productService} for ${campaign.audience}.`,
    audience: stratBrief?.targetAudience || campaign.audience,
    tone: "Clear, direct, and benefit-focused.",
    textDirection: `Lead with the core benefit. Use active voice. Keep CTAs to 3–5 words. Avoid jargon.`,
    visualDirection: `Clean composition focused on the product/outcome. Use lifestyle or product imagery. Avoid stock-photo clichés.`,
    videoDirection: `15–30 second hook-led format. Open on the audience's pain point, resolve with the product/offer in 3 scenes. Close with CTA.`,
    channelAdaptations: JSON.stringify(
      channels.length > 0
        ? channels.map((ch) => `${ch}: adapt format and aspect ratio for platform norms.`)
        : ["Adapt content format and aspect ratio per channel requirements."]
    ),
    usageRightsReminders: JSON.stringify([
      "Confirm usage rights for all images and footage before production.",
      "Document rights in the Asset Library before campaign publish.",
    ]),
    prohibitedElements: JSON.stringify([
      "No unsupported performance claims.",
      "No competitor mentions.",
      "No fabricated statistics or testimonials.",
      ...(stratBrief?.risksSafetyNotes ? ((): string[] => { try { return JSON.parse(stratBrief.risksSafetyNotes) as string[]; } catch { return []; } })() : []),
    ]),
    generatedAt: new Date(),
  };
}

function buildMockImagePromptSpecs(campaign: CampaignRow, creativeBrief: CreativeBriefRow | null) {
  const channels = (() => { try { return JSON.parse(campaign.channels || "[]") as string[]; } catch { return [] as string[]; } })();
  return {
    imagePrompts: JSON.stringify([
      `${campaign.productService} hero shot: clean product on neutral background, professional lighting, high contrast. For ${campaign.audience}.`,
      `Lifestyle image: ${campaign.audience} using or benefiting from ${campaign.productService}. Natural light, candid feel.`,
      `Problem-solution split: left panel shows the challenge, right panel shows the outcome enabled by ${campaign.productService}.`,
    ]),
    compositionNotes: creativeBrief?.visualDirection || "Rule-of-thirds composition. Product or subject in the leading third. Clear visual hierarchy.",
    styleDirection: "Minimal, modern. Brand-consistent color palette. Avoid overly staged or stock-photo aesthetic.",
    productSceneNotes: `Showcase ${campaign.productService} in context of use. Ensure product is clearly visible and legible at small sizes.`,
    channelFormatNotes: JSON.stringify(
      channels.length > 0
        ? channels.map((ch) => `${ch}: use platform-standard aspect ratio (check platform spec). Ensure text-safe zones are respected.`)
        : ["Produce assets in 1:1, 4:5, and 9:16 aspect ratios to cover major platforms."]
    ),
    usageRightsReminders: JSON.stringify([
      "Do not generate actual images — these are prompt specs only.",
      "Confirm usage rights for any reference imagery before commissioning.",
      "Document all rights in the Asset Library before publish.",
    ]),
    generatedAt: new Date(),
  };
}

function buildMockVideoScriptSpecs(campaign: CampaignRow, creativeBrief: CreativeBriefRow | null) {
  const channels = (() => { try { return JSON.parse(campaign.channels || "[]") as string[]; } catch { return [] as string[]; } })();
  const tone = creativeBrief?.tone || "clear, direct";
  return {
    videoConcept: `A short-form, hook-led video introducing ${campaign.productService} to ${campaign.audience}. Objective: drive ${campaign.objective}.`,
    shortScript: `[HOOK — 0–3s]\nOpen on: [relatable challenge for ${campaign.audience}].\n\n[PROBLEM — 3–8s]\nVO/Text: "Struggling with [pain point]?"\n\n[SOLUTION — 8–18s]\nIntroduce ${campaign.productService}. Show key benefit. Tone: ${tone}.\n\n[CTA — 18–25s]\n"[Strong CTA]. Visit [landing URL]."`,
    storyboardOutline: `Frame 1: Hook — attention-grabbing visual or question.\nFrame 2: Problem statement with text overlay.\nFrame 3: Product showcase or outcome visual.\nFrame 4: Key benefit callout.\nFrame 5: CTA screen with logo and URL.`,
    sceneList: JSON.stringify([
      "Scene 1 (0–3s): Hook — relatable challenge or bold statement.",
      `Scene 2 (3–8s): Problem framing for ${campaign.audience}.`,
      `Scene 3 (8–18s): ${campaign.productService} as the solution — key benefit.`,
      "Scene 4 (18–25s): CTA with landing URL.",
    ]),
    voiceoverDraft: `Struggling with [pain point]? ${campaign.productService} helps ${campaign.audience} ${campaign.objective}. [CTA] — find out how at [URL].`,
    captionDraft: `Draft captions (review before use):\n- "Finally — ${campaign.productService} for ${campaign.audience}."\n- "[Benefit statement]. Learn more at [URL]."\n- "[CTA] ↓"`,
    platformAspectRatioNotes: JSON.stringify(
      channels.length > 0
        ? channels.map((ch) => {
            if (ch === "instagram" || ch === "tiktok") return `${ch}: 9:16 (vertical, 1080×1920). Safe zones apply.`;
            if (ch === "youtube") return "youtube: 16:9 (landscape, 1920×1080). Bumper: 6s.";
            if (ch === "snapchat") return "snapchat: 9:16 (vertical). Keep CTA in bottom safe zone.";
            return `${ch}: verify platform spec for supported aspect ratios.`;
          })
        : ["Produce in 9:16 (vertical) and 16:9 (landscape). Add 1:1 for feed placements."]
    ),
    generatedAt: new Date(),
  };
}

export default router;
