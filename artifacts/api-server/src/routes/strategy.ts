import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, strategyIntakesTable, strategyDiagnosesTable, campaignsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";
import { getAIProvider, MockAIProvider } from "../lib/ai-provider";

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