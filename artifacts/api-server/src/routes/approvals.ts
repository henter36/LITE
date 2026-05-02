import { Router } from "express";
import { db } from "@workspace/db";
import { approvalDecisionsTable, generatedAssetsTable, auditLogsTable, campaignsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();
const VALID_DECISIONS = ["approved", "rejected", "changes_requested"];

function serialize(a: typeof approvalDecisionsTable.$inferSelect) {
  return { id: a.id, assetId: a.assetId, campaignId: a.campaignId, actor: a.actor, decision: a.decision, reason: a.reason, createdAt: a.createdAt.toISOString() };
}

router.get("/approvals", requireAuth, async (req, res) => {
  if (!req.query.assetId && !req.query.campaignId) {
    return res.status(400).json({ error: "assetId or campaignId is required" });
  }
  const conditions = [];
  if (req.query.assetId) {
    conditions.push(eq(approvalDecisionsTable.assetId, Number(req.query.assetId)));
    const [asset] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, Number(req.query.assetId)));
    if (asset) {
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, asset.campaignId));
      if (campaign) {
        const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
        if (!role) return res.status(403).json({ error: "Access denied" });
      }
    }
  }
  if (req.query.campaignId) {
    conditions.push(eq(approvalDecisionsTable.campaignId, Number(req.query.campaignId)));
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(req.query.campaignId)));
    if (campaign) {
      const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
      if (!role) return res.status(403).json({ error: "Access denied" });
    }
  }
  const approvals = await db.select().from(approvalDecisionsTable).where(and(...conditions)).orderBy(approvalDecisionsTable.createdAt);
  res.json(approvals.map(serialize));
});

router.post("/approvals", requireAuth, async (req, res) => {
  const { assetId, campaignId, decision, reason } = req.body;

  if (decision === "publish_live") {
    return res.status(403).json({ error: "Live ad publishing is disabled in Marketing OS Lite MVP." });
  }
  if (!assetId && !campaignId) {
    return res.status(400).json({ error: "At least one of assetId or campaignId is required" });
  }
  if (!decision || !VALID_DECISIONS.includes(decision)) {
    return res.status(400).json({ error: `Invalid decision. Must be one of: ${VALID_DECISIONS.join(", ")}` });
  }

  const userId = req.session.userId!;
  let workspaceId: number | null = null;

  if (assetId) {
    const [asset] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, Number(assetId)));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, asset.campaignId));
    if (campaign) workspaceId = campaign.workspaceId;
  }
  if (!workspaceId && campaignId) {
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    workspaceId = campaign.workspaceId;
  }

  if (!workspaceId) {
    return res.status(400).json({ error: "Could not determine workspace from provided identifiers" });
  }

  const role = await getMemberRole(userId, workspaceId);
  if (!role) return res.status(403).json({ error: "Access denied" });
  if (!hasMinRole(role, "editor")) return res.status(403).json({ error: "Requires editor role or above" });

  const approvalActor = actor(req);
  const [approval] = await db.insert(approvalDecisionsTable).values({
    assetId: assetId || null, campaignId: campaignId || null,
    actor: approvalActor, decision, reason: reason || "",
  }).returning();

  if (assetId) {
    const statusMap: Record<string, string> = { approved: "approved", rejected: "rejected", changes_requested: "reviewed" };
    await db.update(generatedAssetsTable).set({ status: statusMap[decision] || "reviewed" }).where(eq(generatedAssetsTable.id, Number(assetId)));
    const [asset] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, Number(assetId)));
    if (asset) {
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, asset.campaignId));
      if (campaign) {
        await db.insert(auditLogsTable).values({ workspaceId: campaign.workspaceId, action: `asset_${decision}`, entityType: "asset", entityId: assetId, actor: approvalActor, details: `Asset ${decision}: ${reason || "no reason"}` });
      }
    }
  }

  res.status(201).json(serialize(approval));
});

export default router;
