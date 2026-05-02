import { Router } from "express";
import { db } from "@workspace/db";
import { trackingLinksTable, campaignsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireWorkspaceRole, actor } from "../middleware/auth";

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
  const links = req.query.campaignId
    ? await db.select().from(trackingLinksTable).where(eq(trackingLinksTable.campaignId, Number(req.query.campaignId))).orderBy(trackingLinksTable.createdAt)
    : await db.select().from(trackingLinksTable).orderBy(trackingLinksTable.createdAt);
  res.json(links.map(serialize));
});

router.post("/tracking-links", requireAuth, async (req, res) => {
  const { campaignId, channel, source, medium, campaign, content, finalUrl } = req.body;
  if (!campaignId || !channel || !source || !medium || !campaign || !finalUrl) {
    return res.status(400).json({ error: "Missing required fields: campaignId, channel, source, medium, campaign, finalUrl" });
  }
  let generatedTrackingUrl: string;
  try {
    generatedTrackingUrl = buildUtmUrl(finalUrl, source, medium, campaign, content || "");
  } catch {
    return res.status(400).json({ error: "Invalid finalUrl — must be a valid URL" });
  }
  try {
    const [link] = await db.insert(trackingLinksTable).values({ campaignId: Number(campaignId), channel, source, medium, campaign, content: content || "", finalUrl, generatedTrackingUrl }).returning();
    const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
    if (c) {
      await db.insert(auditLogsTable).values({ workspaceId: c.workspaceId, action: "tracking_link_created", entityType: "tracking_link", entityId: link.id, actor: actor(req), details: `UTM link created for channel "${channel}"` });
    }
    res.status(201).json(serialize(link));
  } catch { res.status(500).json({ error: "Failed to create tracking link" }); }
});

router.delete("/tracking-links/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(trackingLinksTable).where(eq(trackingLinksTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });
  await db.delete(trackingLinksTable).where(eq(trackingLinksTable.id, id));
  res.status(204).send();
});

export default router;
