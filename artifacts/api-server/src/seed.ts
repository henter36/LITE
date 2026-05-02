import { db } from "@workspace/db";
import {
  workspacesTable, brandProfilesTable, campaignsTable, generatedAssetsTable,
  channelVariantsTable, platformConnectionsTable, adMetricsDailyTable,
  recommendationsTable, auditLogsTable, approvalDecisionsTable, trackingLinksTable,
  usersTable, workspaceMembersTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PLATFORMS = ["instagram", "snapchat", "youtube", "x"] as const;
const CHANNELS = ["instagram", "snapchat", "youtube", "x"];

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max)); }
function dateStr(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split("T")[0];
}

async function seed() {
  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(workspacesTable);
  if (Number(existing.count) > 0) {
    console.log("Workspace data already seeded. Checking demo user...");
    // Ensure demo user exists even on re-runs
    const [demoUser] = await db.select().from(usersTable).where(eq(usersTable.email, "demo@marketingos.local"));
    if (!demoUser) {
      const [ws] = await db.select().from(workspacesTable);
      if (ws) {
        const hash = await bcrypt.hash("Demo12345!", 12);
        const [u] = await db.insert(usersTable).values({ email: "demo@marketingos.local", passwordHash: hash, name: "Demo User" }).returning();
        await db.insert(workspaceMembersTable).values({ workspaceId: ws.id, userId: u.id, role: "owner" });
        console.log("Demo user created: demo@marketingos.local / Demo12345!");
      }
    } else {
      console.log("Demo user already exists.");
    }
    return;
  }

  console.log("Seeding database...");

  // 1. Demo user (must come first to get ID for workspace membership)
  const demoPasswordHash = await bcrypt.hash("Demo12345!", 12);
  const [demoUser] = await db.insert(usersTable).values({
    email: "demo@marketingos.local",
    passwordHash: demoPasswordHash,
    name: "Demo User",
  }).returning();

  // 2. Workspace
  const [workspace] = await db.insert(workspacesTable).values({
    name: "Bright & Bold Agency", businessType: "Marketing Agency", country: "United States",
    language: "English", defaultCurrency: "USD",
  }).returning();

  // 3. Link demo user as owner of workspace
  await db.insert(workspaceMembersTable).values({
    workspaceId: workspace.id, userId: demoUser.id, role: "owner",
  });

  // 4. Brand Profile
  const [brand] = await db.insert(brandProfilesTable).values({
    workspaceId: workspace.id,
    brandName: "Bright & Bold",
    toneOfVoice: "Confident, energetic, approachable",
    targetAudience: "Small business owners and entrepreneurs aged 25-45",
    productsServices: "Digital marketing services, social media management, ad campaigns",
    forbiddenClaims: "Do not claim guaranteed ROI. Do not promise overnight results.",
    preferredChannels: JSON.stringify(["instagram", "youtube", "x"]),
    visualNotes: "Bold colors, clean layouts. Use high-contrast imagery. Avoid stock photo clichés.",
  }).returning();

  // 5. Campaigns
  const campaigns = await db.insert(campaignsTable).values([
    {
      workspaceId: workspace.id, name: "Summer Brand Awareness 2025", objective: "awareness",
      productService: "Digital Marketing Services", audience: "Small business owners, 25-45",
      geography: "United States, Canada", budgetSuggestion: 5000,
      startDate: dateStr(30), endDate: dateStr(-30),
      channels: JSON.stringify(["instagram", "youtube", "x"]), landingUrl: "https://example.com/summer",
      status: "active",
    },
    {
      workspaceId: workspace.id, name: "Q3 Lead Generation Sprint", objective: "leads",
      productService: "Social Media Management Package", audience: "E-commerce businesses",
      geography: "United States", budgetSuggestion: 8000,
      startDate: dateStr(15), endDate: dateStr(-45),
      channels: JSON.stringify(["instagram", "snapchat"]), landingUrl: "https://example.com/leads",
      status: "approved",
    },
    {
      workspaceId: workspace.id, name: "YouTube Product Demo Push", objective: "traffic",
      productService: "Ad Campaign Management Tool", audience: "Marketing managers",
      geography: "United Kingdom, Australia", budgetSuggestion: 3000,
      startDate: dateStr(5), endDate: dateStr(-25),
      channels: JSON.stringify(["youtube", "x"]), landingUrl: "https://example.com/demo",
      status: "draft",
    },
  ]).returning();

  // 6. Platform connections
  const mockAccounts = [
    { platform: "instagram", accountName: "brightbold_ig", mockSpend: 1842.5, mockImpressions: 87400, mockClicks: 3210 },
    { platform: "snapchat", accountName: "BrightBoldSnap", mockSpend: 920.0, mockImpressions: 42000, mockClicks: 1890 },
    { platform: "youtube", accountName: "Bright & Bold Official", mockSpend: 2100.0, mockImpressions: 155000, mockClicks: 6200 },
    { platform: "x", accountName: "@brightbold", mockSpend: 650.0, mockImpressions: 38000, mockClicks: 950 },
  ];
  const connections = await db.insert(platformConnectionsTable).values(
    mockAccounts.map(a => ({ ...a, workspaceId: workspace.id, accountId: `mock_${a.platform}_${Date.now()}`, status: "connected", lastSyncAt: new Date() }))
  ).returning();

  // 7. Generated assets for campaign 1
  const [asset1] = await db.insert(generatedAssetsTable).values({
    campaignId: campaigns[0].id,
    headline: "Unlock Your Brand's Full Potential This Summer",
    shortCaption: "Small business owners: stop guessing and start growing. Our digital marketing pros have the blueprint for your summer surge.",
    longCaption: "The summer season is your biggest opportunity to connect with new customers and re-engage existing ones. Our digital marketing services are designed specifically for small business owners who want measurable results without the agency price tag. From social media management to targeted ad campaigns, we have everything you need to make this your best quarter yet. Join over 500 businesses already on the path to sustainable growth.",
    cta: "Get Your Free Strategy Session",
    hashtags: JSON.stringify(["#digitalmarketing", "#smallbusiness", "#growth", "#summerdeals", "#marketing"]),
    videoScript: "[SCENE 1 - Hook]\nSplit-screen: busy entrepreneur vs. relaxed entrepreneur with strong metrics.\n\n[SCENE 2 - Problem]\nText overlay: \"Still running ads that don't convert?\"\n\n[SCENE 3 - Solution]\nShow Bright & Bold dashboard with growing metrics.\n\n[SCENE 4 - Results]\nTestimonial overlay with business names and outcomes.\n\n[SCENE 5 - CTA]\n\"Book your free strategy session today\" — URL and phone number.",
    storyboardOutline: "Frame 1: Attention-grabbing split comparison\nFrame 2: Pain point statement\nFrame 3: Service showcase\nFrame 4: Social proof / testimonials\nFrame 5: Strong CTA with contact info",
    status: "approved",
  }).returning();

  await db.insert(channelVariantsTable).values(CHANNELS.map(ch => ({
    assetId: asset1.id, channel: ch,
    headline: ch === "x" ? "Unlock Your Brand's Potential" : asset1.headline,
    caption: asset1.shortCaption,
    cta: ch === "instagram" ? "Tap link in bio" : ch === "snapchat" ? "Swipe Up" : ch === "youtube" ? "Subscribe & Learn" : "See thread",
    hashtags: JSON.stringify(["#marketing", `#${ch}`, "#smallbusiness"]),
  })));

  // 8. Approval for asset
  await db.insert(approvalDecisionsTable).values({
    assetId: asset1.id, campaignId: campaigns[0].id,
    actor: "Demo User", decision: "approved", reason: "Great hook, brand voice is on point.",
  });

  // 9. Tracking links
  await db.insert(trackingLinksTable).values([
    { campaignId: campaigns[0].id, channel: "instagram", source: "instagram", medium: "paid_social", campaign: "summer-awareness-2025", content: "carousel_v1", finalUrl: "https://example.com/summer", generatedTrackingUrl: "https://example.com/summer?utm_source=instagram&utm_medium=paid_social&utm_campaign=summer-awareness-2025&utm_content=carousel_v1" },
    { campaignId: campaigns[0].id, channel: "youtube", source: "youtube", medium: "video", campaign: "summer-awareness-2025", content: "demo_video", finalUrl: "https://example.com/summer", generatedTrackingUrl: "https://example.com/summer?utm_source=youtube&utm_medium=video&utm_campaign=summer-awareness-2025&utm_content=demo_video" },
    { campaignId: campaigns[1].id, channel: "instagram", source: "instagram", medium: "paid_social", campaign: "q3-lead-gen", content: "lead_form_v2", finalUrl: "https://example.com/leads", generatedTrackingUrl: "https://example.com/leads?utm_source=instagram&utm_medium=paid_social&utm_campaign=q3-lead-gen&utm_content=lead_form_v2" },
  ]);

  // 10. 30 days of mock metrics for campaigns 1 and 2
  const metricsData: typeof adMetricsDailyTable.$inferInsert[] = [];
  for (let day = 30; day >= 1; day--) {
    const date = dateStr(day);
    for (const platform of ["instagram", "youtube", "x"]) {
      const impressions = rndInt(800, 5000);
      const clicks = rndInt(20, 200);
      const spend = rnd(20, 150);
      metricsData.push({ campaignId: campaigns[0].id, platform, date, spend, impressions, clicks, ctr: clicks / impressions * 100, cpc: clicks > 0 ? spend / clicks : 0, conversions: rndInt(0, 8) });
    }
    for (const platform of ["instagram", "snapchat"]) {
      const impressions = rndInt(500, 3000);
      const clicks = rndInt(10, 120);
      const spend = rnd(15, 100);
      metricsData.push({ campaignId: campaigns[1].id, platform, date, spend, impressions, clicks, ctr: clicks / impressions * 100, cpc: clicks > 0 ? spend / clicks : 0, conversions: rndInt(0, 5) });
    }
  }
  await db.insert(adMetricsDailyTable).values(metricsData);

  // 11. Recommendations
  await db.insert(recommendationsTable).values([
    { workspaceId: workspace.id, campaignId: campaigns[0].id, type: "creative", title: "Test a stronger headline hook", description: "Your Instagram CTR is 1.2% — below benchmark. Try opening with a question or bold statistic to capture attention in the first 2 seconds.", priority: "high", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[0].id, type: "channel", title: "YouTube is your best performing channel", description: "YouTube is generating 3x higher CTR than X for this campaign. Consider reallocating creative effort to YouTube shorts and pre-roll ads.", priority: "medium", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[1].id, type: "audience", title: "Narrow Snapchat audience targeting", description: "CPC on Snapchat is $4.20 — significantly above target. Try narrowing age range to 25-34 and layering interest targeting.", priority: "high", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[1].id, type: "landing_page", title: "Landing page conversion rate is low", description: "Campaign 2 has 340 clicks but only 12 conversions (3.5%). Review the landing page for clarity, load speed, and CTA prominence.", priority: "high", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[0].id, type: "creative", title: "Add social proof to ad copy", description: "Adding a customer testimonial or a specific result (e.g. '500 businesses trust us') to your ad copy can improve click-through by 15-20%.", priority: "medium", isRead: true },
    { workspaceId: workspace.id, type: "channel", title: "Consider adding Snapchat to Campaign 1", description: "Your Snapchat account shows strong performance metrics. Expanding Campaign 1 to Snapchat could increase overall reach by ~30%.", priority: "low", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[0].id, type: "creative", title: "Video content outperforms static images", description: "Across your YouTube campaigns, video ads are delivering 2.4x more conversions than static assets. Prioritize video production for Q4.", priority: "medium", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[2].id, type: "audience", title: "UK audience responding better than AU", description: "Campaign 3 shows CTR of 2.1% in the UK vs 0.9% in Australia. Consider geo-splitting and tailoring copy for each market.", priority: "medium", isRead: false },
    { workspaceId: workspace.id, type: "creative", title: "Refresh creative assets for Campaign 1", description: "Campaign 1 has been running for 30 days. Creative fatigue typically sets in after 3-4 weeks. Consider refreshing visual assets and testing new headline variants.", priority: "low", isRead: false },
    { workspaceId: workspace.id, campaignId: campaigns[1].id, type: "channel", title: "Instagram outperforming Snapchat by 2x", description: "For Campaign 2, Instagram is delivering 2x the clicks at half the CPC of Snapchat. Focus creative optimization efforts on Instagram.", priority: "medium", isRead: false },
  ]);

  // 12. Audit logs
  await db.insert(auditLogsTable).values([
    { workspaceId: workspace.id, action: "workspace_created", entityType: "workspace", entityId: workspace.id, actor: "Demo User", details: `Workspace "Bright & Bold Agency" created` },
    { workspaceId: workspace.id, action: "brand_profile_created", entityType: "brand_profile", entityId: brand.id, actor: "Demo User", details: "Brand profile configured for Bright & Bold" },
    { workspaceId: workspace.id, action: "campaign_created", entityType: "campaign", entityId: campaigns[0].id, actor: "Demo User", details: `Campaign "Summer Brand Awareness 2025" created` },
    { workspaceId: workspace.id, action: "campaign_created", entityType: "campaign", entityId: campaigns[1].id, actor: "Demo User", details: `Campaign "Q3 Lead Generation Sprint" created` },
    { workspaceId: workspace.id, action: "campaign_created", entityType: "campaign", entityId: campaigns[2].id, actor: "Demo User", details: `Campaign "YouTube Product Demo Push" created` },
    { workspaceId: workspace.id, action: "content_generated", entityType: "asset", entityId: asset1.id, actor: "system", details: "Simulated content generated for Summer Brand Awareness 2025" },
    { workspaceId: workspace.id, action: "asset_approved", entityType: "asset", entityId: asset1.id, actor: "Demo User", details: "Asset approved: Great hook, brand voice is on point." },
    { workspaceId: workspace.id, action: "campaign_approved", entityType: "campaign", entityId: campaigns[1].id, actor: "Demo User", details: `Campaign "Q3 Lead Generation Sprint" approved for launch` },
    { workspaceId: workspace.id, action: "mock_connection_created", entityType: "connection", entityId: connections[0].id, actor: "Demo User", details: "Simulated Instagram account connected" },
    { workspaceId: workspace.id, action: "mock_connection_created", entityType: "connection", entityId: connections[1].id, actor: "Demo User", details: "Simulated Snapchat account connected" },
    { workspaceId: workspace.id, action: "mock_connection_created", entityType: "connection", entityId: connections[2].id, actor: "Demo User", details: "Simulated YouTube account connected" },
    { workspaceId: workspace.id, action: "mock_connection_created", entityType: "connection", entityId: connections[3].id, actor: "Demo User", details: "Simulated X account connected" },
    { workspaceId: workspace.id, action: "tracking_link_created", entityType: "tracking_link", actor: "Demo User", details: "UTM link created for Instagram channel" },
    { workspaceId: workspace.id, action: "mock_sync_executed", entityType: "connection", actor: "system", details: "Scheduled mock sync for all 4 ad platform connections" },
    { workspaceId: workspace.id, action: "recommendations_generated", entityType: "recommendation", actor: "system", details: "10 recommendations generated from rules engine" },
  ]);

  console.log("Seeding complete!");
  console.log("Demo user: demo@marketingos.local / Demo12345!");
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
