import { db } from "@workspace/db";
import { recommendationsTable, adMetricsDailyTable, campaignsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function generateRecommendationsForWorkspace(
  workspaceId: number,
  actorName: string,
): Promise<number> {
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.workspaceId, workspaceId));
  const newRecs: typeof recommendationsTable.$inferInsert[] = [];

  for (const campaign of campaigns) {
    if (campaign.endDate) {
      const endDate = new Date(campaign.endDate);
      const daysLeft = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft >= 0 && daysLeft < 7) {
        const days = Math.ceil(daysLeft);
        newRecs.push({
          workspaceId,
          campaignId: campaign.id,
          type: "budget",
          title: "Campaign ending soon",
          description: `"${campaign.name}" ends in ${days} day${days === 1 ? "" : "s"}. Review performance and decide whether to extend or let it close.`,
          priority: "high",
        });
      }
    }

    const metrics = await db.select().from(adMetricsDailyTable).where(eq(adMetricsDailyTable.campaignId, campaign.id));
    if (metrics.length === 0) continue;

    const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
    const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
    const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
    const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    if (avgCtr < 1.5) {
      newRecs.push({
        workspaceId, campaignId: campaign.id, type: "creative",
        title: "Improve your hook or headline",
        description: `CTR for "${campaign.name}" is ${avgCtr.toFixed(2)}% — below the 1.5% benchmark. Consider testing a stronger opening hook or more compelling headline.`,
        priority: "high",
      });
    }
    if (avgCpc > 3) {
      newRecs.push({
        workspaceId, campaignId: campaign.id, type: "audience",
        title: "Narrow your audience targeting",
        description: `CPC for "${campaign.name}" is $${avgCpc.toFixed(2)} — higher than recommended. Try narrowing your target audience to reduce cost per click.`,
        priority: "medium",
      });
    }
    if (totalConversions < 5 && totalClicks > 50) {
      newRecs.push({
        workspaceId, campaignId: campaign.id, type: "landing_page",
        title: "Review your landing page experience",
        description: `"${campaign.name}" has ${totalClicks} clicks but only ${totalConversions} conversions. Check load speed, CTA clarity, and ad-to-page message match.`,
        priority: "high",
      });
    }

    const byPlatform: Record<string, { clicks: number; impressions: number }> = {};
    for (const m of metrics) {
      if (!byPlatform[m.platform]) byPlatform[m.platform] = { clicks: 0, impressions: 0 };
      byPlatform[m.platform].clicks += m.clicks;
      byPlatform[m.platform].impressions += m.impressions;
    }
    const platformCtrs = Object.entries(byPlatform)
      .map(([p, d]) => ({ p, ctr: d.impressions > 0 ? d.clicks / d.impressions : 0 }))
      .sort((a, b) => b.ctr - a.ctr);
    if (platformCtrs.length >= 2) {
      const best = platformCtrs[0];
      newRecs.push({
        workspaceId, campaignId: campaign.id, type: "channel",
        title: `Focus more on ${best.p}`,
        description: `${best.p} is your top-performing channel for "${campaign.name}" with a CTR of ${(best.ctr * 100).toFixed(2)}%. Consider allocating more creative effort here.`,
        priority: "low",
      });
    }
  }

  if (newRecs.length > 0) {
    await db.insert(recommendationsTable).values(newRecs);
    await db.insert(auditLogsTable).values({
      workspaceId,
      action: "recommendations_generated",
      entityType: "recommendation",
      actor: actorName,
      details: `${newRecs.length} recommendation${newRecs.length === 1 ? "" : "s"} generated`,
    });
  }

  return newRecs.length;
}
