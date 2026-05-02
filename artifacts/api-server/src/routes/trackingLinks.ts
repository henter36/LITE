import { Router } from "express";
import { db } from "@workspace/db";
import { trackingLinksTable, campaignsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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
  return {
    id: t.id,
    campaignId: t.campaignId,
    channel: t.channel,
    source: t.source,
    medium: t.medium,
    campaign: t.campaign,
    content: t.content,
    finalUrl: t.finalUrl,
    generatedTrackingUrl: t.generatedTrackingUrl,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tracking-links", async (req, res) => {
  const links = req.query.campaignId
    ? await db.select().from(trackingLinksTable).where(eq(trackingLinksTable.campaignId, Number(req.query.campaignId))).orderBy(trackingLinksTable.createdAt)
    : await db.select().from(trackingLinksTable).orderBy(trackingLinksTable.createdAt);
  res.json(links.map(serialize));
});

router.post("/tracking-links", async (req, res) => {
  const { campaignId, channel, source, medium, campaign, content, finalUrl } = req.body;
  let generatedTrackingUrl: string;
  try {
    generatedTrackingUrl = buildUtmUrl(finalUrl, source, medium, campaign, content || "");
  } catch {
    generatedTrackingUrl = `${finalUrl}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${content || ""}`;
  }
  const [link] = await db.insert(trackingLinksTable).values({
    campaignId: Number(campaignId), channel, source, medium,
    campaign, content: content || "", finalUrl, generatedTrackingUrl,
  }).returning();
  const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
  if (c) {
    await db.insert(auditLogsTable).values({ workspaceId: c.workspaceId, action: "tracking_link_created", entityType: "tracking_link", entityId: link.id, actor: "user", details: `UTM link created for channel "${channel}"` });
  }
  res.status(201).json(serialize(link));
});

router.delete("/tracking-links/:id", async (req, res) => {
  await db.delete(trackingLinksTable).where(eq(trackingLinksTable.id, parseInt(req.params.id)));
  res.status(204).send();
});

export default router;
