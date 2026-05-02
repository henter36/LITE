import { Router } from "express";
import { db } from "@workspace/db";
import { approvalDecisionsTable, generatedAssetsTable, auditLogsTable, campaignsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function serialize(a: typeof approvalDecisionsTable.$inferSelect) {
  return {
    id: a.id,
    assetId: a.assetId,
    campaignId: a.campaignId,
    actor: a.actor,
    decision: a.decision,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/approvals", async (req, res) => {
  const conditions = [];
  if (req.query.assetId) conditions.push(eq(approvalDecisionsTable.assetId, Number(req.query.assetId)));
  if (req.query.campaignId) conditions.push(eq(approvalDecisionsTable.campaignId, Number(req.query.campaignId)));
  const approvals = conditions.length > 0
    ? await db.select().from(approvalDecisionsTable).where(and(...conditions)).orderBy(approvalDecisionsTable.createdAt)
    : await db.select().from(approvalDecisionsTable).orderBy(approvalDecisionsTable.createdAt);
  res.json(approvals.map(serialize));
});

router.post("/approvals", async (req, res) => {
  const { assetId, campaignId, actor, decision, reason } = req.body;

  // Safety guard: reject if trying to publish live ads
  if (decision === "publish_live") {
    return res.status(403).json({ error: "Live ad publishing is disabled in Marketing OS Lite MVP." });
  }

  const [approval] = await db.insert(approvalDecisionsTable).values({
    assetId: assetId || null,
    campaignId: campaignId || null,
    actor,
    decision,
    reason: reason || "",
  }).returning();

  // Update asset status if assetId provided
  if (assetId) {
    const statusMap: Record<string, string> = { approved: "approved", rejected: "rejected", changes_requested: "reviewed" };
    await db.update(generatedAssetsTable).set({ status: statusMap[decision] || "reviewed" }).where(eq(generatedAssetsTable.id, Number(assetId)));
    const [asset] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, Number(assetId)));
    if (asset) {
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, asset.campaignId));
      if (campaign) {
        await db.insert(auditLogsTable).values({ workspaceId: campaign.workspaceId, action: `asset_${decision}`, entityType: "asset", entityId: assetId, actor, details: `Asset ${decision}: ${reason || "no reason"}` });
      }
    }
  }

  res.status(201).json(serialize(approval));
});

export default router;
