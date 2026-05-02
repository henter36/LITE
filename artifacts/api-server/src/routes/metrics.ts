import { Router } from "express";
import { db } from "@workspace/db";
import { adMetricsDailyTable, campaignsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/metrics", async (req, res) => {
  const conditions = [];
  if (req.query.campaignId) conditions.push(eq(adMetricsDailyTable.campaignId, Number(req.query.campaignId)));
  if (req.query.platform) conditions.push(eq(adMetricsDailyTable.platform, String(req.query.platform)));
  if (req.query.fromDate) conditions.push(gte(adMetricsDailyTable.date, String(req.query.fromDate)));
  if (req.query.toDate) conditions.push(lte(adMetricsDailyTable.date, String(req.query.toDate)));
  const metrics = conditions.length > 0
    ? await db.select().from(adMetricsDailyTable).where(and(...conditions)).orderBy(adMetricsDailyTable.date)
    : await db.select().from(adMetricsDailyTable).orderBy(adMetricsDailyTable.date);
  res.json(metrics);
});

router.get("/metrics/dashboard", async (req, res) => {
  const allMetrics = req.query.workspaceId
    ? await db.select({ m: adMetricsDailyTable }).from(adMetricsDailyTable)
        .innerJoin(campaignsTable, eq(adMetricsDailyTable.campaignId, campaignsTable.id))
        .where(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select({ m: adMetricsDailyTable }).from(adMetricsDailyTable);

  const metrics = allMetrics.map(r => r.m);
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  // Channel breakdown for best/worst
  const byPlatform: Record<string, { spend: number; clicks: number; impressions: number }> = {};
  for (const m of metrics) {
    if (!byPlatform[m.platform]) byPlatform[m.platform] = { spend: 0, clicks: 0, impressions: 0 };
    byPlatform[m.platform].spend += m.spend;
    byPlatform[m.platform].clicks += m.clicks;
    byPlatform[m.platform].impressions += m.impressions;
  }
  const platforms = Object.entries(byPlatform).map(([p, d]) => ({ p, ctr: d.impressions > 0 ? d.clicks / d.impressions : 0 }));
  const bestChannel = platforms.sort((a, b) => b.ctr - a.ctr)[0]?.p || "N/A";
  const worstChannel = platforms.sort((a, b) => a.ctr - b.ctr)[0]?.p || "N/A";

  // Daily trend (aggregate by date)
  const byDate: Record<string, { date: string; spend: number; impressions: number; clicks: number; conversions: number }> = {};
  for (const m of metrics) {
    if (!byDate[m.date]) byDate[m.date] = { date: m.date, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    byDate[m.date].spend += m.spend;
    byDate[m.date].impressions += m.impressions;
    byDate[m.date].clicks += m.clicks;
    byDate[m.date].conversions += m.conversions;
  }
  const dailyTrend = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  res.json({ totalSpend, totalImpressions, totalClicks, avgCtr, avgCpc, totalConversions, bestChannel, worstChannel, dailyTrend });
});

router.get("/metrics/channel-comparison", async (req, res) => {
  const allMetrics = req.query.workspaceId
    ? await db.select({ m: adMetricsDailyTable }).from(adMetricsDailyTable)
        .innerJoin(campaignsTable, eq(adMetricsDailyTable.campaignId, campaignsTable.id))
        .where(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select({ m: adMetricsDailyTable }).from(adMetricsDailyTable);

  const byPlatform: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
  for (const { m } of allMetrics) {
    if (!byPlatform[m.platform]) byPlatform[m.platform] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    byPlatform[m.platform].spend += m.spend;
    byPlatform[m.platform].impressions += m.impressions;
    byPlatform[m.platform].clicks += m.clicks;
    byPlatform[m.platform].conversions += m.conversions;
  }
  const result = Object.entries(byPlatform).map(([platform, d]) => ({
    platform,
    spend: d.spend,
    impressions: d.impressions,
    clicks: d.clicks,
    ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
    cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
    conversions: d.conversions,
  }));
  res.json(result);
});

export default router;
