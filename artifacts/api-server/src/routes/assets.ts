import { Router } from "express";
import { db } from "@workspace/db";
import { generatedAssetsTable, channelVariantsTable, campaignsTable, auditLogsTable, brandProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";
import {
  getAIProvider,
  MockAIProvider,
  type BrandContext,
  type GenerationResult,
} from "../lib/ai-provider";
import { logger } from "../lib/logger";

const router = Router();
const CHANNELS = ["instagram", "snapchat", "youtube", "x", "tiktok"];

function channelVariant(
  assetId: number,
  channel: string,
  result: GenerationResult["output"],
) {
  const overrides: Record<string, { cta?: string; hashtags?: string[] }> = {
    instagram: { cta: "Tap the link in bio", hashtags: ["#instagram", "#instamarketing", ...result.hashtags.slice(0, 3)] },
    snapchat: { cta: "Swipe Up", hashtags: ["#snapchat", "#snap", ...result.hashtags.slice(0, 3)] },
    youtube: { cta: "Subscribe & Learn More", hashtags: ["#youtube", "#video", ...result.hashtags.slice(0, 3)] },
    x: { cta: "See thread below", hashtags: result.hashtags.slice(0, 3) },
    tiktok: { cta: "Follow for more", hashtags: ["#tiktok", "#tiktokviral", ...result.hashtags.slice(0, 3)] },
  };
  const v = overrides[channel] ?? {};
  return {
    assetId,
    channel,
    headline: result.headline,
    caption: result.shortCaption,
    cta: v.cta ?? result.cta,
    hashtags: JSON.stringify(v.hashtags ?? result.hashtags),
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
    aiProvider: a.aiProvider ?? null,
    aiModel: a.aiModel ?? null,
    promptVersion: a.promptVersion ?? null,
    aiFallbackUsed: a.aiFallbackUsed ?? null,
    imageBrief: a.imageBrief ?? null,
    videoBrief: a.videoBrief ?? null,
    assetReference: a.assetReference ?? null,
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
  const assets = await db
    .select()
    .from(generatedAssetsTable)
    .where(and(...conditions))
    .orderBy(generatedAssetsTable.createdAt);
  res.json(assets.map(serializeAsset));
});

router.post("/assets", requireAuth, async (req, res): Promise<void> => {
  const { campaignId } = req.body;
  if (!campaignId) { res.status(400).json({ error: "campaignId required" }); return; }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, Number(campaignId)));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  if (!hasMinRole(role, "editor")) {
    res.status(403).json({ error: "Requires editor role or above" });
    return;
  }

  // Fetch brand profile for this workspace
  const [brandProfile] = await db
    .select()
    .from(brandProfilesTable)
    .where(eq(brandProfilesTable.workspaceId, campaign.workspaceId));

  const brand: BrandContext | undefined = brandProfile
    ? {
        brandName: brandProfile.brandName,
        toneOfVoice: brandProfile.toneOfVoice,
        targetAudience: brandProfile.targetAudience ?? campaign.audience,
        forbiddenClaims: brandProfile.forbiddenClaims,
        preferredChannels: JSON.parse(brandProfile.preferredChannels || "[]"),
        visualNotes: brandProfile.visualNotes,
      }
    : undefined;

  // Resolve provider — falls back to mock gracefully if key missing
  const { provider, selectedProvider, keyMissing } = getAIProvider();

  let generationResult: GenerationResult;
  let usedFallback = false;

  try {
    generationResult = await provider.generate({
      campaign: {
        name: campaign.name,
        objective: campaign.objective,
        productService: campaign.productService,
        audience: campaign.audience,
        geography: campaign.geography,
      },
      brand,
    });
  } catch (err) {
    // Runtime failure of AI provider — fall back to mock
    logger.warn({ err, selectedProvider }, "AI provider threw at runtime — falling back to mock");
    const mock = new MockAIProvider();
    generationResult = await mock.generate({
      campaign: {
        name: campaign.name,
        objective: campaign.objective,
        productService: campaign.productService,
        audience: campaign.audience,
        geography: campaign.geography,
      },
      brand,
    });
    generationResult.metadata.fallbackUsed = true;
    generationResult.metadata.provider = "mock";
    usedFallback = true;
  }

  // Key-missing at selection time also counts as fallback
  if (keyMissing) {
    generationResult.metadata.fallbackUsed = true;
    usedFallback = true;
  }

  const { output, metadata } = generationResult;

  // Persist asset with metadata columns
  const [asset] = await db
    .insert(generatedAssetsTable)
    .values({
      campaignId: Number(campaignId),
      headline: output.headline,
      shortCaption: output.shortCaption,
      longCaption: output.longCaption,
      cta: output.cta,
      hashtags: JSON.stringify(output.hashtags),
      videoScript: output.videoScript,
      storyboardOutline: output.storyboardOutline,
      status: "draft",
      aiProvider: metadata.provider,
      aiModel: metadata.model,
      promptVersion: metadata.promptVersion,
      aiFallbackUsed: metadata.fallbackUsed,
    })
    .returning();

  // Insert channel variants
  for (const ch of CHANNELS) {
    await db.insert(channelVariantsTable).values(channelVariant(asset.id, ch, output));
  }

  // Build brand note for audit log
  const brandNote = brand
    ? `brand "${brand.brandName}" applied — tone: ${brand.toneOfVoice}`
    : "no brand profile — generic content";

  const fallbackNote = usedFallback ? " [fallback: mock used]" : "";

  await db.insert(auditLogsTable).values({
    workspaceId: campaign.workspaceId,
    action: "content_generated",
    entityType: "asset",
    entityId: asset.id,
    actor: actor(req),
    details: `Content generated for campaign "${campaign.name}" — provider: ${metadata.provider}, model: ${metadata.model}, prompt: ${metadata.promptVersion}${fallbackNote} — ${brandNote} — campaignId: ${campaign.id}, workspaceId: ${campaign.workspaceId}`,
  });

  req.log.info(
    {
      assetId: asset.id,
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId,
      provider: metadata.provider,
      model: metadata.model,
      promptVersion: metadata.promptVersion,
      fallbackUsed: metadata.fallbackUsed,
    },
    "Content generated",
  );

  res.status(201).json([serializeAsset(asset)]);
});

router.get("/assets/:id", requireAuth, async (req, res): Promise<void> => {
  const [a] = await db
    .select()
    .from(generatedAssetsTable)
    .where(eq(generatedAssetsTable.id, parseInt(String(req.params.id))));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId));
  if (campaign) {
    const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
    if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  }
  res.json(serializeAsset(a));
});

router.patch("/assets/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [a] = await db.select().from(generatedAssetsTable).where(eq(generatedAssetsTable.id, id));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId));
  if (campaign) {
    const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
    if (!role) { res.status(403).json({ error: "Access denied" }); return; }
    if (!hasMinRole(role, "editor")) { res.status(403).json({ error: "Requires editor role or above" }); return; }
  }

  const { imageBrief, videoBrief, assetReference } = req.body;
  const updates: Partial<{ imageBrief: string; videoBrief: string; assetReference: string }> = {};
  if (imageBrief !== undefined) updates.imageBrief = imageBrief;
  if (videoBrief !== undefined) updates.videoBrief = videoBrief;
  if (assetReference !== undefined) updates.assetReference = assetReference;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No updatable fields provided (imageBrief, videoBrief, assetReference)" });
    return;
  }

  const [updated] = await db.update(generatedAssetsTable).set(updates).where(eq(generatedAssetsTable.id, id)).returning();
  res.json(serializeAsset(updated));
});

router.get("/assets/:id/variants", requireAuth, async (req, res): Promise<void> => {
  const assetId = parseInt(String(req.params.id));
  const [a] = await db
    .select()
    .from(generatedAssetsTable)
    .where(eq(generatedAssetsTable.id, assetId));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId));
  if (campaign) {
    const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
    if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  }
  const variants = await db
    .select()
    .from(channelVariantsTable)
    .where(eq(channelVariantsTable.assetId, assetId));
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
