import { Router } from "express";
import { db } from "@workspace/db";
import { generatedAssetsTable, channelVariantsTable, campaignsTable, auditLogsTable, brandProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();
const CHANNELS = ["instagram", "snapchat", "youtube", "x", "tiktok"];

const MOCK_HEADLINES = [
  "Discover the Difference",
  "Transform Your Experience",
  "Unleash Your Potential",
  "Built for the Bold",
  "The Future Is Here",
];
const MOCK_CTAS = ["Shop Now", "Learn More", "Get Started", "Try Free", "Explore Today"];
const MOCK_HASHTAGS = [
  ["#marketing", "#business", "#growth", "#digital", "#success"],
  ["#brand", "#strategy", "#social", "#campaign", "#results"],
  ["#startup", "#entrepreneur", "#innovation", "#sales", "#leads"],
];

const TONE_OPENERS: Record<string, string> = {
  professional: "Trusted by professionals,",
  casual: "Here's something made for you:",
  bold: "No fluff. Just results.",
  friendly: "We built this for people like you.",
  energetic: "Ready to level up?",
  authoritative: "The data is clear:",
  playful: "Psst — you're going to love this.",
  inspirational: "What if things could be different?",
  witty: "Clever campaigns deserve clever tools.",
  empathetic: "We understand what you're working toward.",
};

interface BrandContext {
  brandName: string;
  toneOfVoice: string;
  forbiddenClaims: string;
  preferredChannels: string[];
  visualNotes: string;
}

function filterForbiddenClaims(text: string, forbiddenClaims: string): string {
  if (!forbiddenClaims.trim()) return text;
  const phrases = forbiddenClaims
    .split(/[\n.!?,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 3);
  let result = text;
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      result = result.replace(regex, "[filtered]");
    } catch {
      // Ignore malformed patterns
    }
  }
  return result;
}

function mockGenerate(
  campaign: { name: string; objective: string; productService: string; audience: string },
  brand?: BrandContext,
) {
  const hIdx = Math.floor(Math.random() * MOCK_HEADLINES.length);
  const cIdx = Math.floor(Math.random() * MOCK_CTAS.length);
  const tagIdx = Math.floor(Math.random() * MOCK_HASHTAGS.length);

  const cta = MOCK_CTAS[cIdx];
  const hashtags = MOCK_HASHTAGS[tagIdx];

  // Headline: include brand name when available
  const headline = brand?.brandName
    ? `${brand.brandName} — ${MOCK_HEADLINES[hIdx]}`
    : `${MOCK_HEADLINES[hIdx]}: ${campaign.productService}`;

  // Caption: reflect tone of voice when available
  const toneKey = brand?.toneOfVoice?.toLowerCase().trim() ?? "";
  const toneOpener = TONE_OPENERS[toneKey] ?? "";
  const shortCaption = toneOpener
    ? `${toneOpener} ${campaign.productService} was made for ${campaign.audience}. Your ${campaign.objective} journey starts now.`
    : `Reaching ${campaign.audience} with ${campaign.productService}. Your ${campaign.objective} starts here.`;

  const longCaption = brand?.brandName
    ? `${brand.brandName} is proud to introduce ${campaign.productService} — designed specifically for ${campaign.audience}. Whether you're focused on ${campaign.objective}, this is the solution built for your goals. Explore what's possible and see measurable results. ${cta} and experience the ${brand.brandName} difference.`
    : `Introducing ${campaign.productService} — designed specifically for ${campaign.audience}. Whether you're focused on ${campaign.objective}, this is the solution built for your goals. Explore what's possible and see measurable results with a focused strategy. ${cta} and experience the difference yourself.`;

  const videoScript = `[SCENE 1 - Hook]\nOpen on a relatable challenge your audience faces.\n\n[SCENE 2 - Solution]\nIntroduce ${campaign.productService} as the answer.\n\n[SCENE 3 - Benefits]\nHighlight 3 key benefits for ${campaign.audience}.\n\n[SCENE 4 - CTA]\n${cta}! Visit our website or swipe up to learn more.`;

  // Storyboard: append visual direction notes when available
  const visualSection = brand?.visualNotes
    ? `\n\nVisual direction: ${brand.visualNotes}`
    : "";
  const storyboardOutline = `Frame 1: Attention-grabbing hook visual\nFrame 2: Problem statement text overlay\nFrame 3: Product/service showcase\nFrame 4: Demonstrated outcome\nFrame 5: CTA screen with ${brand?.brandName ? `${brand.brandName} ` : ""}logo and URL${visualSection}`;

  // Apply forbidden claims filter
  const applyFilter = (text: string) =>
    brand?.forbiddenClaims ? filterForbiddenClaims(text, brand.forbiddenClaims) : text;

  return {
    headline: applyFilter(headline),
    shortCaption: applyFilter(shortCaption),
    longCaption: applyFilter(longCaption),
    cta,
    hashtags,
    videoScript,
    storyboardOutline,
  };
}

function channelVariant(assetId: number, channel: string, base: ReturnType<typeof mockGenerate>) {
  const overrides: Record<string, { cta?: string; hashtags?: string[] }> = {
    instagram: { cta: "Tap the link in bio", hashtags: ["#instagram", "#instamarketing", ...base.hashtags.slice(0, 3)] },
    snapchat: { cta: "Swipe Up", hashtags: ["#snapchat", "#snap", ...base.hashtags.slice(0, 3)] },
    youtube: { cta: "Subscribe & Learn More", hashtags: ["#youtube", "#video", ...base.hashtags.slice(0, 3)] },
    x: { cta: "See thread below", hashtags: base.hashtags.slice(0, 3) },
    tiktok: { cta: "Follow for more", hashtags: ["#tiktok", "#tiktokviral", ...base.hashtags.slice(0, 3)] },
  };
  const v = overrides[channel] || {};
  return {
    assetId,
    channel,
    headline: base.headline,
    caption: base.shortCaption,
    cta: v.cta || base.cta,
    hashtags: JSON.stringify(v.hashtags || base.hashtags),
  };
}

function serializeAsset(a: typeof generatedAssetsTable.$inferSelect) {
  return {
    id: a.id,
    campaignId: a.campaignId,
    headline: a.headline,
    shortCaption: a.shortCaption,
    longCaption: a.longCaption,
    cta: a.cta,
    hashtags: JSON.parse(a.hashtags || "[]"),
    videoScript: a.videoScript,
    storyboardOutline: a.storyboardOutline,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/assets", requireAuth, async (req, res): Promise<void> => {
  if (!req.query.campaignId) {
    res.status(400).json({ error: "campaignId is required" });
    return;
  }
  const campaignId = Number(req.query.campaignId);
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }

  const conditions = [eq(generatedAssetsTable.campaignId, campaignId)];
  if (req.query.status) conditions.push(eq(generatedAssetsTable.status, String(req.query.status)));
  const assets = await db.select().from(generatedAssetsTable).where(and(...conditions)).orderBy(generatedAssetsTable.createdAt);
  res.json(assets.map(serializeAsset));
});

router.post("/assets", requireAuth, async (req, res): Promise<void> => {
  const { campaignId } = req.body;
  if (!campaignId) { res.status(400).json({ error: "campaignId required" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, Number(campaignId)));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  if (!hasMinRole(role, "editor")) { res.status(403).json({ error: "Requires editor role or above" }); return; }

  // Look up brand profile for this workspace
  const [brandProfile] = await db
    .select()
    .from(brandProfilesTable)
    .where(eq(brandProfilesTable.workspaceId, campaign.workspaceId));

  const brand: BrandContext | undefined = brandProfile
    ? {
        brandName: brandProfile.brandName,
        toneOfVoice: brandProfile.toneOfVoice,
        forbiddenClaims: brandProfile.forbiddenClaims,
        preferredChannels: JSON.parse(brandProfile.preferredChannels || "[]"),
        visualNotes: brandProfile.visualNotes,
      }
    : undefined;

  const generated = mockGenerate(campaign, brand);

  const [asset] = await db.insert(generatedAssetsTable).values({
    campaignId: Number(campaignId),
    headline: generated.headline,
    shortCaption: generated.shortCaption,
    longCaption: generated.longCaption,
    cta: generated.cta,
    hashtags: JSON.stringify(generated.hashtags),
    videoScript: generated.videoScript,
    storyboardOutline: generated.storyboardOutline,
    status: "draft",
  }).returning();

  for (const ch of CHANNELS) {
    await db.insert(channelVariantsTable).values(channelVariant(asset.id, ch, generated));
  }

  const brandNote = brand
    ? `brand profile "${brand.brandName}" applied — tone: ${brand.toneOfVoice}`
    : "no brand profile — generic content generated";

  await db.insert(auditLogsTable).values({
    workspaceId: campaign.workspaceId,
    action: "content_generated",
    entityType: "asset",
    entityId: asset.id,
    actor: actor(req),
    details: `Simulated content generated for campaign "${campaign.name}" — ${brandNote}`,
  });

  res.status(201).json([serializeAsset(asset)]);
});

router.get("/assets/:id", requireAuth, async (req, res): Promise<void> => {
  const [a] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, parseInt(String(req.params.id))));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId));
  if (campaign) {
    const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
    if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  }
  res.json(serializeAsset(a));
});

router.get("/assets/:id/variants", requireAuth, async (req, res): Promise<void> => {
  const assetId = parseInt(String(req.params.id));
  const [a] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, assetId));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId));
  if (campaign) {
    const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
    if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  }
  const variants = await db.select().from(channelVariantsTable).where(eq(channelVariantsTable.assetId, assetId));
  res.json(
    variants.map((v) => ({
      id: v.id,
      assetId: v.assetId,
      channel: v.channel,
      headline: v.headline,
      caption: v.caption,
      cta: v.cta,
      hashtags: JSON.parse(v.hashtags || "[]"),
    })),
  );
});

export default router;
