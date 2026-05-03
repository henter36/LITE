import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();

function parseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

router.post("/strategy/intake", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, ...input } = req.body ?? {};
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
  const payload = {
    workspaceId: Number(workspaceId),
    ...input,
    currentChannels: Array.isArray(input.currentChannels) ? input.currentChannels : [],
  };
  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "strategy_intake_saved",
    entityType: "strategy",
    entityId: 0,
    actor: actor(req),
    details: `Strategy intake saved for workspace ${workspaceId}`,
  });
  res.status(201).json(payload);
});

router.post("/strategy/diagnose", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, intake } = req.body ?? {};
  if (!workspaceId || !intake) {
    res.status(400).json({ error: "workspaceId and intake are required" });
    return;
  }
  const role = await getMemberRole(req.session.userId!, Number(workspaceId));
  if (!role) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  const audienceClarity = intake.targetCustomers ? "Moderate" : "Low";
  const offerStrength = intake.currentOffers ? "Moderate" : "Low";
  const channelReadiness = Array.isArray(intake.currentChannels) && intake.currentChannels.length > 0 ? "Moderate" : "Low";
  const diagnosis = {
    currentSituation: "The business has a defined offer and can now translate it into a testable strategy.",
    audienceClarity,
    offerStrength,
    channelReadiness,
    funnelGaps: ["Strategy definition", "Creative brief clarity", "Measurement discipline"],
    risks: ["Broad messaging", "Weak differentiation", "Insufficient human review"],
    opportunities: ["Sharper positioning", "Better channel fit", "Reusable approved creative"],
  };
  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "strategy_diagnosis_generated",
    entityType: "strategy",
    entityId: 0,
    actor: actor(req),
    details: `Strategy diagnosis generated for workspace ${workspaceId}`,
  });
  res.json(diagnosis);
});

router.post("/strategy/drafts", requireAuth, async (req, res): Promise<void> => {
  const { workspaceId, intake, diagnosis, audienceAnalysis } = req.body ?? {};
  if (!workspaceId || !intake || !diagnosis || !audienceAnalysis) {
    res.status(400).json({ error: "workspaceId, intake, diagnosis, and audienceAnalysis are required" });
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
  const strategyDraft = {
    positioningStatement: `For ${intake.targetCustomers || "the target audience"}, ${intake.businessOverview || "the business"} is the best choice because it clearly connects the offer to the audience need.`,
    recommendedChannels: Array.isArray(intake.currentChannels) && intake.currentChannels.length > 0 ? intake.currentChannels.slice(0, 4) : ["instagram", "youtube"],
    contentPillars: [
      "Problem awareness",
      "Offer clarity",
      "Proof and trust",
    ],
    campaignIdeas: [
      "Launch a clear-value test campaign",
      "Use audience-specific proof points",
      "Create one message per segment",
    ],
    actionPlan30Days: [
      "Week 1: finalize messaging and offer angle",
      "Week 2: prepare campaign assets and approval",
      "Week 3: launch approved campaign",
      "Week 4: review results and iterate",
    ],
    measurementPlan: [
      "Track approved assets",
      "Measure link clicks and conversions",
      "Review audience resonance",
    ],
    objective: "leads",
    audience: intake.targetCustomers || "",
    productService: intake.currentOffers || intake.productsServices || "",
    channels: Array.isArray(intake.currentChannels) ? intake.currentChannels : [],
    messagingAngle: audienceAnalysis.messagingAngle || "Lead with clarity and trust",
  };
  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "strategy_draft_created",
    entityType: "strategy",
    entityId: 0,
    actor: actor(req),
    details: `Strategy draft created for workspace ${workspaceId}`,
  });
  res.status(201).json(strategyDraft);
});

router.post("/strategy/drafts/:id/create-campaign", requireAuth, async (req, res): Promise<void> => {
  const draftId = Number(req.params.id);
  const { workspaceId, name } = req.body ?? {};
  if (!workspaceId || !name) {
    res.status(400).json({ error: "workspaceId and name are required" });
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
  const [workspaceCampaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, draftId));
  const strategy = parseJson(req.body.strategy ?? null) ?? req.body.strategy;
  const [campaign] = await db.insert(campaignsTable).values({
    workspaceId: Number(workspaceId),
    name,
    objective: strategy?.objective || "leads",
    productService: strategy?.productService || "",
    audience: strategy?.audience || "",
    geography: req.body.geography || workspaceCampaign?.geography || "",
    budgetSuggestion: req.body.budgetSuggestion || 0,
    startDate: req.body.startDate || new Date().toISOString().slice(0, 10),
    endDate: req.body.endDate || new Date().toISOString().slice(0, 10),
    channels: JSON.stringify(strategy?.channels || []),
    landingUrl: req.body.landingUrl || "",
    status: "draft",
  }).returning();
  await db.insert(auditLogsTable).values({
    workspaceId: Number(workspaceId),
    action: "campaign_created_from_strategy",
    entityType: "campaign",
    entityId: campaign.id,
    actor: actor(req),
    details: `Campaign "${name}" created from strategy draft ${draftId}`,
  });
  res.status(201).json(campaign);
});

export default router;