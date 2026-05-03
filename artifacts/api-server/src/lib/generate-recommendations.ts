import { db } from "@workspace/db";
import { recommendationsTable, adMetricsDailyTable, campaignsTable, auditLogsTable, strategyIntakesTable, strategyDiagnosesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

type RecommendationSource = "performance" | "strategy" | "mixed";

type DecisionScore = {
  readinessScore: number;
  strategyAlignmentScore: number;
  riskScore: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDecisionScore(campaign: typeof campaignsTable.$inferSelect, intake?: typeof strategyIntakesTable.$inferSelect, diagnosis?: typeof strategyDiagnosesTable.$inferSelect): DecisionScore {
  const channelCount = JSON.parse(campaign.channels || "[]").length;
  const hasLanding = Boolean(campaign.landingUrl);
  const hasStrategy = Boolean(intake || diagnosis);
  const offerStrong = (diagnosis?.offerSummary ?? "").length >= 50;
  const audienceClear = (intake?.targetAudience ?? "").length >= 40;
  const funnelMissing = Boolean(diagnosis?.whatIsMissing);
  const readinessScore = clampScore(20 + (hasLanding ? 30 : 0) + Math.min(channelCount * 10, 30) + (hasStrategy ? 20 : 0));
  const strategyAlignmentScore = clampScore((hasStrategy ? 40 : 0) + (offerStrong ? 25 : 0) + (audienceClear ? 25 : 0) + (funnelMissing ? 0 : 10));
  const riskScore = clampScore((funnelMissing ? 35 : 0) + (offerStrong ? 0 : 20) + (audienceClear ? 0 : 20) + (channelCount === 0 ? 20 : 0));
  return { readinessScore, strategyAlignmentScore, riskScore };
}

function explainDecision(rec: { source: RecommendationSource; type: string }, strategyContext: boolean) {
  const why = rec.source === "performance"
    ? "Based on recent campaign data."
    : rec.source === "strategy"
      ? "Based on strategy intake and diagnosis."
      : "Based on both strategy and recent campaign data.";
  const expectedImpact = rec.type === "landing_page" ? "Higher conversion clarity." : rec.type === "audience" ? "Better efficiency and focus." : "More confident execution.";
  const riskLevel = rec.source === "mixed" || strategyContext ? "medium" : "low";
  return { why, expectedImpact, riskLevel };
}

function buildRecommendationText(
  base: string,
  rec: { source: RecommendationSource; type: string },
  strategyContext: boolean,
) {
  const details = explainDecision(rec, strategyContext);
  return `${base} Why: ${details.why} Expected impact: ${details.expectedImpact} Risk level: ${details.riskLevel}.`;
}

async function getLatestStrategyContext(workspaceId: number) {
  const [intake] = await db.select().from(strategyIntakesTable).where(eq(strategyIntakesTable.workspaceId, workspaceId)).orderBy(desc(strategyIntakesTable.updatedAt));
  const [diagnosis] = await db.select().from(strategyDiagnosesTable).where(eq(strategyDiagnosesTable.workspaceId, workspaceId)).orderBy(desc(strategyDiagnosesTable.createdAt));
  return { intake, diagnosis };
}

function pushRecommendation(
  list: typeof recommendationsTable.$inferInsert[],
  data: typeof recommendationsTable.$inferInsert & { source: RecommendationSource },
) {
  const { source, ...rest } = data;
  list.push({
    ...rest,
    campaignId: data.campaignId ?? null,
    source,
    description: buildRecommendationText(data.description, data, true),
  } as typeof recommendationsTable.$inferInsert);
}

export async function generateRecommendationsForWorkspace(
  workspaceId: number,
  actorName: string,
): Promise<number> {
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.workspaceId, workspaceId));
  const { intake, diagnosis } = await getLatestStrategyContext(workspaceId);
  const newRecs: typeof recommendationsTable.$inferInsert[] = [];
  const strategyContext = Boolean(intake || diagnosis);

  for (const campaign of campaigns) {
    const scores = getDecisionScore(campaign, intake, diagnosis);
    if (campaign.endDate) {
      const endDate = new Date(campaign.endDate);
      const daysLeft = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft >= 0 && daysLeft < 7) {
        const days = Math.ceil(daysLeft);
        pushRecommendation(newRecs, {
          workspaceId,
          campaignId: campaign.id,
          type: "budget",
          title: "Campaign ending soon",
          description: `"${campaign.name}" ends in ${days} day${days === 1 ? "" : "s"}. Review performance and decide whether to extend or let it close.`,
          priority: "high",
          source: strategyContext ? "mixed" : "performance",
        });
      }
    }
    if (scores.readinessScore < 60 || scores.strategyAlignmentScore < 60 || scores.riskScore > 60) {
      pushRecommendation(newRecs, {
        workspaceId,
        campaignId: campaign.id,
        type: "budget",
        title: "Review campaign decision score",
        description: `Readiness ${scores.readinessScore}/100, alignment ${scores.strategyAlignmentScore}/100, risk ${scores.riskScore}/100.`,
        priority: scores.riskScore > 60 ? "high" : "medium",
        source: strategyContext ? "mixed" : "performance",
      });
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
      pushRecommendation(newRecs, {
        workspaceId, campaignId: campaign.id, type: "creative",
        title: "Improve your hook or headline",
        description: `CTR for "${campaign.name}" is ${avgCtr.toFixed(2)}% — below the 1.5% benchmark. Consider testing a stronger opening hook or more compelling headline.`,
        priority: "high",
        source: strategyContext ? "mixed" : "performance",
      });
    }
    if (avgCpc > 3) {
      pushRecommendation(newRecs, {
        workspaceId, campaignId: campaign.id, type: "audience",
        title: "Narrow your audience targeting",
        description: `CPC for "${campaign.name}" is $${avgCpc.toFixed(2)} — higher than recommended. Try narrowing your target audience to reduce cost per click.`,
        priority: "medium",
        source: strategyContext ? "mixed" : "performance",
      });
    }
    if (totalConversions < 5 && totalClicks > 50) {
      pushRecommendation(newRecs, {
        workspaceId, campaignId: campaign.id, type: "landing_page",
        title: "Review your landing page experience",
        description: `"${campaign.name}" has ${totalClicks} clicks but only ${totalConversions} conversions. Check load speed, CTA clarity, and ad-to-page message match.`,
        priority: "high",
        source: strategyContext ? "mixed" : "performance",
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
      pushRecommendation(newRecs, {
        workspaceId, campaignId: campaign.id, type: "channel",
        title: `Focus more on ${best.p}`,
        description: `${best.p} is your top-performing channel for "${campaign.name}" with a CTR of ${(best.ctr * 100).toFixed(2)}%. Consider allocating more creative effort here.`,
        priority: "low",
        source: strategyContext ? "mixed" : "performance",
      });
    }
  }

  if (intake || diagnosis) {
    const growthGoal = intake?.primaryGoal?.toLowerCase() ?? "";
    const painPoints = intake?.painPoints?.toLowerCase() ?? "";
    const targetCustomers = intake?.targetAudience ?? "";
    const currentChannels = intake?.availableAssets?.toLowerCase() ?? "";
    const offerStrength = diagnosis?.offerSummary ?? "";
    const channelReadiness = diagnosis?.likelyCreativeDirection ?? "";
    const funnelGaps = diagnosis?.whatIsMissing ?? "";
    const opportunities = diagnosis?.whatToTestFirst ?? "";
    const risks = diagnosis?.topObjections ?? "";

    if (funnelGaps) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "landing_page",
        title: "Fix the landing and offer flow first",
        description: `${funnelGaps} Before scaling spend, tighten the landing page and offer sequence.`,
        priority: "high",
        source: "strategy",
      });
    }
    if (channelReadiness && channelReadiness.length < 80) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "channel",
        title: "Focus on one primary channel",
        description: "Channel readiness looks weak. Concentrate on a single primary channel before expanding.",
        priority: "medium",
        source: "strategy",
      });
    }
    if (!targetCustomers || targetCustomers.length < 40) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "audience",
        title: "Refine your target audience",
        description: "Audience clarity is weak. Clarify who the campaign is for before generating more campaigns.",
        priority: "high",
        source: "strategy",
      });
    }
    if (offerStrength && offerStrength.length < 50) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "creative",
        title: "Improve the offer before publishing",
        description: `Offer strength needs work. Strengthen the offer before any publish step.`,
        priority: "high",
        source: "strategy",
      });
    }
    if (growthGoal && currentChannels && !currentChannels.includes(growthGoal.split(" ")[0])) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "channel",
        title: "Adjust the channel mix to match the growth goal",
        description: `Your growth goal (${intake?.primaryGoal || "your goal"}) may need a better channel fit. Review whether the current channels support it.`,
        priority: "medium",
        source: "strategy",
      });
    }
    if (opportunities || risks || painPoints) {
      pushRecommendation(newRecs, {
        workspaceId,
        type: "creative",
        title: "Use strategy to prioritize the next test",
        description: `${opportunities || "Opportunity identified"}${risks ? `; risks: ${risks}` : ""}${painPoints ? `; pain points: ${painPoints}` : ""}.`,
        priority: "low",
        source: diagnosis ? "mixed" : "strategy",
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
      details: `${newRecs.length} recommendation${newRecs.length === 1 ? "" : "s"} generated${strategyContext ? " with strategy context" : ""}`,
    });
  }

  return newRecs.length;
}
