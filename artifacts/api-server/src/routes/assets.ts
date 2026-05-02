import { Router } from "express";
import { db } from "@workspace/db";
import { generatedAssetsTable, channelVariantsTable, campaignsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, actor } from "../middleware/auth";

const router = Router();
const CHANNELS = ["instagram", "snapchat", "youtube", "x"];

const MOCK_HEADLINES = ["Discover the Difference Today","Transform Your Experience","Unleash Your Potential","Built for the Bold","The Future Is Here"];
const MOCK_CTAS = ["Shop Now", "Learn More", "Get Started", "Try Free", "Explore Today"];
const MOCK_HASHTAGS = [
  ["#marketing", "#business", "#growth", "#digital", "#success"],
  ["#brand", "#strategy", "#social", "#campaign", "#results"],
  ["#startup", "#entrepreneur", "#innovation", "#sales", "#leads"],
];

function mockGenerate(campaign: { name: string; objective: string; productService: string; audience: string }) {
  const hIdx = Math.floor(Math.random() * MOCK_HEADLINES.length);
  const cIdx = Math.floor(Math.random() * MOCK_CTAS.length);
  const tagIdx = Math.floor(Math.random() * MOCK_HASHTAGS.length);
  const headline = `${MOCK_HEADLINES[hIdx]}: ${campaign.productService}`;
  const cta = MOCK_CTAS[cIdx];
  const hashtags = MOCK_HASHTAGS[tagIdx];
  const shortCaption = `Reaching ${campaign.audience} with ${campaign.productService}. Your ${campaign.objective} starts here.`;
  const longCaption = `Introducing ${campaign.productService} — designed specifically for ${campaign.audience}. Whether you're focused on ${campaign.objective}, this is the solution built for your goals. Explore what's possible and see measurable results with a focused strategy. ${cta} and experience the difference yourself.`;
  const videoScript = `[SCENE 1 - Hook]\nOpen on a relatable challenge your audience faces.\n\n[SCENE 2 - Solution]\nIntroduce ${campaign.productService} as the answer.\n\n[SCENE 3 - Benefits]\nHighlight 3 key benefits for ${campaign.audience}.\n\n[SCENE 4 - CTA]\n${cta}! Visit our website or swipe up to learn more.`;
  const storyboardOutline = `Frame 1: Attention-grabbing hook visual\nFrame 2: Problem statement text overlay\nFrame 3: Product/service showcase\nFrame 4: Demonstrated outcome\nFrame 5: CTA screen with logo and URL`;
  return { headline, shortCaption, longCaption, cta, hashtags, videoScript, storyboardOutline };
}

function channelVariant(assetId: number, channel: string, base: ReturnType<typeof mockGenerate>) {
  const overrides: Record<string, { cta?: string; hashtags?: string[] }> = {
    instagram: { cta: "Tap the link in bio", hashtags: ["#instagram", "#instamarketing", ...base.hashtags.slice(0, 3)] },
    snapchat: { cta: "Swipe Up", hashtags: ["#snapchat", "#snap", ...base.hashtags.slice(0, 3)] },
    youtube: { cta: "Subscribe & Learn More", hashtags: ["#youtube", "#video", ...base.hashtags.slice(0, 3)] },
    x: { cta: "See thread below", hashtags: base.hashtags.slice(0, 3) },
  };
  const v = overrides[channel] || {};
  return { assetId, channel, headline: base.headline, caption: base.shortCaption, cta: v.cta || base.cta, hashtags: JSON.stringify(v.hashtags || base.hashtags) };
}

function serializeAsset(a: typeof generatedAssetsTable.$inferSelect) {
  return {
    id: a.id, campaignId: a.campaignId, headline: a.headline,
    shortCaption: a.shortCaption, longCaption: a.longCaption, cta: a.cta,
    hashtags: JSON.parse(a.hashtags || "[]"), videoScript: a.videoScript,
    storyboardOutline: a.storyboardOutline, status: a.status, createdAt: a.createdAt.toISOString(),
  };
}

router.get("/assets", requireAuth, async (req, res) => {
  const conditions = [];
  if (req.query.campaignId) conditions.push(eq(generatedAssetsTable.campaignId, Number(req.query.campaignId)));
  if (req.query.status) conditions.push(eq(generatedAssetsTable.status, String(req.query.status)));
  const assets = conditions.length > 0
    ? await db.select().from(generatedAssetsTable).where(and(...conditions)).orderBy(generatedAssetsTable.createdAt)
    : await db.select().from(generatedAssetsTable).orderBy(generatedAssetsTable.createdAt);
  res.json(assets.map(serializeAsset));
});

router.post("/assets", requireAuth, async (req, res) => {
  const { campaignId } = req.body;
  if (!campaignId) return res.status(400).json({ error: "campaignId required" });
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  const generated = mockGenerate(campaign);
  const [asset] = await db.insert(generatedAssetsTable).values({
    campaignId: Number(campaignId), headline: generated.headline, shortCaption: generated.shortCaption,
    longCaption: generated.longCaption, cta: generated.cta, hashtags: JSON.stringify(generated.hashtags),
    videoScript: generated.videoScript, storyboardOutline: generated.storyboardOutline, status: "draft",
  }).returning();
  for (const ch of CHANNELS) {
    await db.insert(channelVariantsTable).values(channelVariant(asset.id, ch, generated));
  }
  await db.insert(auditLogsTable).values({ workspaceId: campaign.workspaceId, action: "content_generated", entityType: "asset", entityId: asset.id, actor: actor(req), details: `Simulated content generated for campaign "${campaign.name}"` });
  res.status(201).json([serializeAsset(asset)]);
});

router.get("/assets/:id", requireAuth, async (req, res) => {
  const [a] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, parseInt(req.params.id)));
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(serializeAsset(a));
});

router.get("/assets/:id/variants", requireAuth, async (req, res) => {
  const variants = await db.select().from(channelVariantsTable).where(eq(channelVariantsTable.assetId, parseInt(req.params.id)));
  res.json(variants.map(v => ({ id: v.id, assetId: v.assetId, channel: v.channel, headline: v.headline, caption: v.caption, cta: v.cta, hashtags: JSON.parse(v.hashtags || "[]") })));
});

export default router;
