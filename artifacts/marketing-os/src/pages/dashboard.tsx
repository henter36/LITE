import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetDashboardMetrics,
  useListCampaigns,
  useListRecommendations,
  useUpdateRecommendation,
  getGetDashboardMetricsQueryKey,
  getListRecommendationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, MousePointerClick, TrendingUp, Zap, Plus, Megaphone } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Link } from "wouter";

function getRecommendationSource(rec: { source?: string | null }) {
  return rec.source === "strategy" || rec.source === "mixed" ? rec.source : "performance";
}

export default function Dashboard() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";

  const { data: metrics, isLoading: isMetricsLoading } = useGetDashboardMetrics(
    { workspaceId: activeWorkspaceId },
    {
      query: {
        enabled: !!activeWorkspaceId,
        queryKey: getGetDashboardMetricsQueryKey({ workspaceId: activeWorkspaceId }),
      },
    },
  );
  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({
    workspaceId: activeWorkspaceId,
  });
  const queryClient = useQueryClient();
  const { data: recommendations } = useListRecommendations({
    workspaceId: activeWorkspaceId,
  });
  const dismissRec = useUpdateRecommendation();

  const unreadRecs = recommendations?.filter((r) => !r.isRead);
  const topRec = unreadRecs?.find((r) => r.priority === "high") ?? unreadRecs?.[0];
  const topCampaigns = campaigns?.slice(0, 3) ?? [];
  const hasCampaigns = (campaigns?.length ?? 0) > 0;

  return (
    <SidebarLayout>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base">Here's what needs your attention today.</p>
      </div>

      {/* Section 1 — Today's Action: always renders */}
      <Card className={topRec ? "border-primary/30 bg-primary/5" : "border-dashed"}>
        <CardContent className="pt-6 pb-5">
          {topRec ? (
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                  Today's Action
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                  Source: {getRecommendationSource(topRec as { source?: string | null })}
                </p>
                <p className="text-lg font-semibold leading-snug">{topRec.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{topRec.description}</p>
                {topRec.campaignId ? (
                  <p className="text-xs text-muted-foreground mt-2">Campaign #{topRec.campaignId}</p>
                ) : null}
                {(topRec as { linkedStrategyId?: number | null }).linkedStrategyId ? (
                  <p className="text-xs text-muted-foreground mt-1">Strategy #{(topRec as { linkedStrategyId?: number | null }).linkedStrategyId}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link href="/campaigns">
                  <Button size="sm" variant="outline" className="w-full">
                    View Campaigns <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground text-xs"
                  disabled={dismissRec.isPending}
                  onClick={() =>
                    dismissRec.mutate(
                      { id: topRec.id, data: { isRead: true } },
                      {
                        onSuccess: () =>
                          queryClient.invalidateQueries({
                            queryKey: getListRecommendationsQueryKey({ workspaceId: activeWorkspaceId }),
                          }),
                      },
                    )
                  }
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Today's Action
                </p>
                <p className="text-lg font-semibold leading-snug text-foreground">
                  {hasCampaigns
                    ? "Connect a campaign to get AI-powered recommendations."
                    : "Create your first campaign to get recommendations."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasCampaigns
                    ? "Once campaigns have performance data, recommendations will appear here."
                    : "Recommendations are generated automatically once you have campaigns and performance data."}
                </p>
              </div>
              {!isViewer && (
                <Link href="/campaigns/new">
                  <Button size="sm" className="shrink-0">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {hasCampaigns ? "New Campaign" : "Create Campaign"}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 — 3 KPIs */}
      {isMetricsLoading ? (
        <div className="grid gap-4 grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Demo Spend</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-bold">${metrics.totalSpend.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Simulated · no real spend</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-bold">{metrics.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg CTR {metrics.avgCtr.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-bold">{metrics.totalConversions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Best: <span className="text-foreground font-medium capitalize">{metrics.bestChannel}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Section 4 — Top 3 Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
          <div className="flex items-center gap-2">
            {!isViewer && (
              <Link href="/campaigns/new">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Campaign
                </Button>
              </Link>
            )}
            <Link href="/campaigns">
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {isCampaignsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : topCampaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-lg mb-1">No campaigns yet</p>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first campaign to start generating ads.
              </p>
              {!isViewer && (
                <Link href="/campaigns/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first campaign
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {campaign.objective}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant={campaign.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {campaign.status}
                      </Badge>
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recommendations?.slice(0, 3).map((rec) => (
              <Card key={`rec-${rec.id}`} className="border-dashed">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {getRecommendationSource(rec as { source?: string | null })}
                      </Badge>
                      {rec.campaignId ? (
                        <span className="text-xs text-muted-foreground">Campaign #{rec.campaignId}</span>
                      ) : (rec as { linkedStrategyId?: number | null }).linkedStrategyId ? (
                        <span className="text-xs text-muted-foreground">Strategy #{(rec as { linkedStrategyId?: number | null }).linkedStrategyId}</span>
                      ) : null}
                    </div>
                    <p className="font-medium mt-2">{rec.title}</p>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    disabled={dismissRec.isPending}
                    onClick={() =>
                      dismissRec.mutate(
                        { id: rec.id, data: { isRead: true } },
                        {
                          onSuccess: () =>
                            queryClient.invalidateQueries({
                              queryKey: getListRecommendationsQueryKey({ workspaceId: activeWorkspaceId }),
                            }),
                        },
                      )
                    }
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
