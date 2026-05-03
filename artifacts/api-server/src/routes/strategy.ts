import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, strategyIntakesTable, strategyDiagnosesTable, campaignsTable, campaignTextSuggestionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";
import { getAIProvider, getAITextAssistProvider, MockAIProvider } from "../lib/ai-provider";

const router = Router();

async function requireWorkspaceEditor(userId: number, workspaceId: number) {
  const role = await getMemberRole(userId, workspaceId);
  if (!role) return null;
  return hasMinRole(role, "editor") ? role : null;
}

router.get("/strategy/intake", requireAuth, async (req, res): Promise<void> => {
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
  const [intake] = await db.select().from(strategyIntakesTable).where(eq(strategyIntakesTable.workspaceId, workspaceId)).orderBy(desc(strategyIntakesTable.updatedAt));
  if (!intake) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(intake);
});

router.post("/strategy/intake", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, ...input } = req.body ?? {};
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const role = await requireWorkspaceEditor(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }
  const [created] = await db.insert(strategyIntakesTable).values({
    workspaceId: Number(workspaceId),
    businessCategory: input.businessCategory || "",
    currentOffer: input.currentOffer || "",
    targetAudience: input.targetAudience || "",
    geography: input.geography || "",
    budgetRange: input.budgetRange || "",
    primaryGoal: input.primaryGoal || "",
    brandVoice: input.brandVoice || "",
    painPoints: input.painPoints || "",
    availableAssets: input.availableAssets || "",
    previousLearnings: input.previousLearnings || "",
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "strategy_intake_created", entityType: "strategy_intake", entityId: created.id, actor: actor(req), details: `Strategy intake created for workspace ${workspaceId}` });
  res.status(201).json(created);
});

router.put("/strategy/intake", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, ...input } = req.body ?? {};
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const role = await requireWorkspaceEditor(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }
  const [existing] = await db.select().from(strategyIntakesTable).where(eq(strategyIntakesTable.workspaceId, Number(workspaceId))).orderBy(desc(strategyIntakesTable.updatedAt));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db.update(strategyIntakesTable).set({
    businessCategory: input.businessCategory ?? existing.businessCategory,
    currentOffer: input.currentOffer ?? existing.currentOffer,
    targetAudience: input.targetAudience ?? existing.targetAudience,
    geography: input.geography ?? existing.geography,
    budgetRange: input.budgetRange ?? existing.budgetRange,
    primaryGoal: input.primaryGoal ?? existing.primaryGoal,
    brandVoice: input.brandVoice ?? existing.brandVoice,
    painPoints: input.painPoints ?? existing.painPoints,
    availableAssets: input.availableAssets ?? existing.availableAssets,
    previousLearnings: input.previousLearnings ?? existing.previousLearnings,
    updatedAt: new Date(),
  }).where(eq(strategyIntakesTable.id, existing.id)).returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "strategy_intake_updated", entityType: "strategy_intake", entityId: updated.id, actor: actor(req), details: `Strategy intake updated for workspace ${workspaceId}` });
  res.json(updated);
});

router.post("/strategy/diagnosis", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId } = req.body ?? {};
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const role = await requireWorkspaceEditor(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }
  const [intake] = await db.select().from(strategyIntakesTable).where(eq(strategyIntakesTable.workspaceId, Number(workspaceId))).orderBy(desc(strategyIntakesTable.updatedAt));
  if (!intake) {
    res.status(404).json({ error: "No strategy intake found" });
    return;
  }
  const { provider } = getAIProvider();
  const ai = provider ?? new MockAIProvider();
  const result = await ai.generate({
    campaign: {
      name: `Strategy for workspace ${workspaceId}`,
      objective: intake.primaryGoal,
      productService: intake.currentOffer,
      audience: intake.targetAudience,
      geography: intake.geography,
    },
  });
  const diagnosis = {
    workspaceId: Number(workspaceId),
    intakeId: intake.id,
    summary: `Focus on ${intake.primaryGoal} with clearer positioning.`,
    whatIsMissing: intake.painPoints || "More detail on constraints and objections.",
    whatToTestFirst: `Test ${intake.currentOffer} with ${intake.targetAudience}.`,
    likelyCreativeDirection: result.output.headline,
    audienceSummary: intake.targetAudience,
    offerSummary: intake.currentOffer,
    topObjections: intake.painPoints || "",
    suggestedCTA: result.output.cta,
  };
  const [created] = await db.insert(strategyDiagnosesTable).values({
    workspaceId: Number(workspaceId),
    intakeId: intake.id,
    summary: diagnosis.summary,
    whatIsMissing: diagnosis.whatIsMissing,
    whatToTestFirst: diagnosis.whatToTestFirst,
    likelyCreativeDirection: diagnosis.likelyCreativeDirection,
    audienceSummary: diagnosis.audienceSummary,
    offerSummary: diagnosis.offerSummary,
    topObjections: diagnosis.topObjections,
    suggestedCTA: diagnosis.suggestedCTA,
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId: Number(workspaceId), action: "strategy_diagnosis_created", entityType: "strategy_diagnosis", entityId: created.id, actor: actor(req), details: `Strategy diagnosis created for workspace ${workspaceId}` });
  res.status(201).json(created);
});

router.post("/strategy/text-assist", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, campaignId } = req.body ?? {};
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }

  const role = await getMemberRole(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (!hasMinRole(role, "editor")) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
  if (!campaign || campaign.workspaceId !== Number(workspaceId)) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const completionContext = {
    hasApprovedAd: false,
    isReady: campaign.status === "approved" || campaign.status === "active",
    hasApprovedCreativeAsset: false,
    hasUsageRightsNotes: false,
    hasTrackingLink: Boolean(campaign.landingUrl),
    hasSelectedChannels: (campaign.channels?.length ?? 0) > 0,
  };

  const brandContext = {
    brandName: campaign.name,
    toneOfVoice: "clear",
    targetAudience: campaign.audience,
    forbiddenClaims: "",
    preferredChannels: JSON.parse(campaign.channels || "[]"),
    visualNotes: "",
  };

  const { provider, keyMissing, selectedProvider } = getAITextAssistProvider();
  if (keyMissing) {
    res.status(503).json({
      error: "AI text generation is unavailable until OPENAI_API_KEY is configured",
      code: "AI_TEXT_UNAVAILABLE",
      output: {
        hooks: [],
        adCopyVariants: [],
        captions: [],
        ctas: [],
        improvementNotes: [],
        missingContextWarnings: ["OPENAI_API_KEY is missing."],
        safetyNotes: ["Draft-only runtime unavailable."],
      },
    });
    return;
  }

  if (selectedProvider === "mock" && process.env.NODE_ENV === "production") {
    res.status(503).json({
      error: "AI text generation is unavailable in production without OPENAI_API_KEY",
      code: "AI_TEXT_UNAVAILABLE",
      output: {
        hooks: [],
        adCopyVariants: [],
        captions: [],
        ctas: [],
        improvementNotes: [],
        missingContextWarnings: ["Mock fallback is disabled in production."],
        safetyNotes: ["Draft-only runtime unavailable."],
      },
    });
    return;
  }

  const result = await provider.generateText({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      objective: campaign.objective,
      productService: campaign.productService,
      audience: campaign.audience,
      geography: campaign.geography,
      selectedChannels: JSON.parse(campaign.channels || "[]"),
      strategySummary: `${campaign.objective} • ${campaign.audience} • ${campaign.productService}`,
      completionContext,
    },
    brand: brandContext,
    existingDrafts: {},
  });

  const source = selectedProvider === "openai" ? "real" : "mock";
  const [saved] = await db.insert(campaignTextSuggestionsTable).values({
    workspaceId: Number(workspaceId),
    campaignId: campaign.id,
    generatedByUserId: req.session.userId ?? null,
    status: "draft",
    source,
    hooks: JSON.stringify(result.output.hooks),
    adCopyVariants: JSON.stringify(result.output.adCopyVariants),
    captions: JSON.stringify(result.output.captions),
    ctas: JSON.stringify(result.output.ctas),
    improvementNotes: JSON.stringify(result.output.improvementNotes),
    missingContextWarnings: JSON.stringify(result.output.missingContextWarnings),
    safetyNotes: JSON.stringify(result.output.safetyNotes),
  }).returning();
  await db.update(campaignTextSuggestionsTable).set({ updatedAt: new Date() }).where(eq(campaignTextSuggestionsTable.id, saved.id));
  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "campaign_text_suggestions_created",
    entityType: "campaign_text_suggestion",
    entityId: saved.id,
    actor: actor(req),
    details: `Text suggestions created for campaign ${campaign.id} with source ${source}`,
  });
  res.json({ ...result.output, source, status: "draft" });
});

router.get("/strategy/text-assist", requireAuth, async (req, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  const campaignId = Number(req.query.campaignId);
  if (!workspaceId || !campaignId) {
    res.status(400).json({ error: "workspaceId and campaignId are required" });
    return;
  }
  const role = await getMemberRole(req.session.userId!, workspaceId);
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
  if (!campaign || campaign.workspaceId !== workspaceId) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  const [draft] = await db.select().from(campaignTextSuggestionsTable).where(eq(campaignTextSuggestionsTable.workspaceId, workspaceId)).where(eq(campaignTextSuggestionsTable.campaignId, campaignId)).orderBy(desc(campaignTextSuggestionsTable.createdAt));
  if (!draft) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    hooks: JSON.parse(draft.hooks),
    adCopyVariants: JSON.parse(draft.adCopyVariants),
    captions: JSON.parse(draft.captions),
    ctas: JSON.parse(draft.ctas),
    improvementNotes: JSON.parse(draft.improvementNotes),
    missingContextWarnings: JSON.parse(draft.missingContextWarnings),
    safetyNotes: JSON.parse(draft.safetyNotes),
    source: draft.source,
    status: draft.status,
  });
});

router.get("/strategy/text-suggestions", requireAuth, async (req, res): Promise<void> => {
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
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;
  const suggestions = await db
    .select({
      id: campaignTextSuggestionsTable.id,
      workspaceId: campaignTextSuggestionsTable.workspaceId,
      campaignId: campaignTextSuggestionsTable.campaignId,
      generatedByUserId: campaignTextSuggestionsTable.generatedByUserId,
      status: campaignTextSuggestionsTable.status,
      source: campaignTextSuggestionsTable.source,
      hooks: campaignTextSuggestionsTable.hooks,
      adCopyVariants: campaignTextSuggestionsTable.adCopyVariants,
      captions: campaignTextSuggestionsTable.captions,
      ctas: campaignTextSuggestionsTable.ctas,
      improvementNotes: campaignTextSuggestionsTable.improvementNotes,
      missingContextWarnings: campaignTextSuggestionsTable.missingContextWarnings,
      safetyNotes: campaignTextSuggestionsTable.safetyNotes,
      createdAt: campaignTextSuggestionsTable.createdAt,
      updatedAt: campaignTextSuggestionsTable.updatedAt,
      campaignName: campaignsTable.name,
      campaignObjective: campaignsTable.objective,
      campaignChannels: campaignsTable.channels,
    })
    .from(campaignTextSuggestionsTable)
    .leftJoin(campaignsTable, eq(campaignTextSuggestionsTable.campaignId, campaignsTable.id))
    .orderBy(desc(campaignTextSuggestionsTable.createdAt));

  const filtered = suggestions.filter(
    (item) => item.workspaceId === workspaceId && (!campaignId || item.campaignId === campaignId),
  );
  res.json(
    filtered.map((item) => ({
      ...item,
      hooks: JSON.parse(item.hooks || "[]"),
      adCopyVariants: JSON.parse(item.adCopyVariants || "[]"),
      captions: JSON.parse(item.captions || "[]"),
      ctas: JSON.parse(item.ctas || "[]"),
      improvementNotes: JSON.parse(item.improvementNotes || "[]"),
      missingContextWarnings: JSON.parse(item.missingContextWarnings || "[]"),
      safetyNotes: JSON.parse(item.safetyNotes || "[]"),
      campaignChannels: JSON.parse(item.campaignChannels || "[]"),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  );
});

router.get("/strategy/diagnosis/latest", requireAuth, async (req, res): Promise<void> => {
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
  const [diagnosis] = await db.select().from(strategyDiagnosesTable).where(eq(strategyDiagnosesTable.workspaceId, workspaceId)).orderBy(desc(strategyDiagnosesTable.createdAt));
  if (!diagnosis) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(diagnosis);
});

router.post("/strategy/create-campaign", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId } = req.body ?? {};
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }

  const role = await getMemberRole(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (!hasMinRole(role, "editor")) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }

  const [intake] = await db.select().from(strategyIntakesTable).where(eq(strategyIntakesTable.workspaceId, Number(workspaceId))).orderBy(desc(strategyIntakesTable.updatedAt));
  const [diagnosis] = await db.select().from(strategyDiagnosesTable).where(eq(strategyDiagnosesTable.workspaceId, Number(workspaceId))).orderBy(desc(strategyDiagnosesTable.createdAt));
  if (!intake || !diagnosis) {
    res.status(404).json({ error: "Strategy intake and diagnosis are required" });
    return;
  }

  const name = `${intake.businessCategory || "Strategy"} Campaign`;
  const [campaign] = await db.insert(campaignsTable).values({
    workspaceId: Number(workspaceId),
    name,
    objective: intake.primaryGoal || "leads",
    productService: intake.currentOffer || "",
    audience: diagnosis.audienceSummary || intake.targetAudience || "",
    geography: intake.geography || "",
    budgetSuggestion: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    channels: JSON.stringify((intake.availableAssets || "").split(",").map((s) => s.trim()).filter(Boolean)),
    landingUrl: "",
    status: "draft",
  }).returning();

  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "campaign_created_from_strategy",
    entityType: "campaign",
    entityId: campaign.id,
    actor: actor(req),
    details: `Campaign created from strategy for workspace ${workspaceId}`,
  });

  res.status(201).json(campaign);
});

export default router;