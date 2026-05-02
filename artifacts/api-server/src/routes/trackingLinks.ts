import { Router } from "express";
import { db } from "@workspace/db";
import { trackingLinksTable, campaignsTable, auditLogsTable, workspaceMembersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();

function buildUtmUrl(finalUrl: string, source: string, medium: string, campaign: string, content: string) {
  const url = new URL(finalUrl.startsWith("http") ? finalUrl : `https://${finalUrl}`);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

function serialize(t: typeof trackingLinksTable.$inferSelect) {
  return { id: t.id, campaignId: t.campaignId, channel: t.channel, source: t.source, medium: t.medium, campaign: t.campaign, content: t.content, finalUrl: t.finalUrl, generatedTrackingUrl: t.generatedTrackingUrl, createdAt: t.createdAt.toISOString() };
}

router.get("/tracking-links", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  if (req.query.campaignId) {
    const campaignId = Number(req.query.campaignId);
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const role = await getMemberRole(userId, campaign.workspaceId);
    if (!role) return res.status(403).json({ error: "Access denied" });
    const links = await db.select().from(trackingLinksTable).where(eq(trackingLinksTable.campaignId, campaignId)).orderBy(trackingLinksTable.createdAt);
    return res.json(links.map(serialize));
  }

  const memberships = await db
    .select({ workspaceId: workspaceMembersTable.workspaceId })
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.userId, userId));

  if (memberships.length === 0) return res.json([]);

  const wIds = memberships.map(m => m.workspaceId);
  const rows = await db
    .select({ l: trackingLinksTable })
    .from(trackingLinksTable)
    .innerJoin(campaignsTable, eq(trackingLinksTable.campaignId, campaignsTable.id))
    .where(inArray(campaignsTable.workspaceId, wIds))
    .orderBy(trackingLinksTable.createdAt);

  res.json(rows.map(r => serialize(r.l)));
});

router.post("/tracking-links", requireAuth, async (req, res) => {
  const { campaignId, channel, source, medium, campaign, content, finalUrl } = req.body;
  if (!campaignId || !channel || !source || !medium || !campaign || !finalUrl) {
    return res.status(400).json({ error: "Missing required fields: campaignId, channel, source, medium, campaign, finalUrl" });
  }

  const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
  if (!c) return res.status(404).json({ error: "Campaign not found" });
  const role = await getMemberRole(req.session.userId!, c.workspaceId);
  if (!role) return res.status(403).json({ error: "Access denied" });
  if (!hasMinRole(role, "editor")) return res.status(403).json({ error: "Requires editor role or above" });

  let generatedTrackingUrl: string;
  try {
    generatedTrackingUrl = buildUtmUrl(finalUrl, source, medium, campaign, content || "");
  } catch {
    return res.status(400).json({ error: "Invalid finalUrl — must be a valid URL" });
  }
  try {
    const [link] = await db.insert(trackingLinksTable).values({ campaignId: Number(campaignId), channel, source, medium, campaign, content: content || "", finalUrl, generatedTrackingUrl }).returning();
    await db.insert(auditLogsTable).values({ workspaceId: c.workspaceId, action: "tracking_link_created", entityType: "tracking_link", entityId: link.id, actor: actor(req), details: `UTM link created for channel "${channel}"` });
    res.status(201).json(serialize(link));
  } catch { res.status(500).json({ error: "Failed to create tracking link" }); }
});

router.delete("/tracking-links/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(trackingLinksTable).where(eq(trackingLinksTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });
  const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, existing.campaignId));
  if (c) {
    const role = await getMemberRole(req.session.userId!, c.workspaceId);
    if (!role) return res.status(403).json({ error: "Access denied" });
    if (!hasMinRole(role, "editor")) return res.status(403).json({ error: "Requires editor role or above" });
  }
  await db.delete(trackingLinksTable).where(eq(trackingLinksTable.id, id));
  res.status(204).send();
});

export default router;
