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
import { ArrowRight, BarChart3, CheckCircle2, DollarSign, MousePointerClick, Plus, ShieldCheck, TrendingUp, Zap, Megaphone, Activity, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { Link } from "wouter";

function getRecommendationSource(rec: { source?: string | null }) {
  return rec.source === "strategy" || rec.source === "mixed" ? rec.source : "performance";
}

export default function Dashboard() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";
  const { data: metrics, isLoading: isMetricsLoading } = useGetDashboardMetrics(
    { workspaceId: activeWorkspaceId },
    { query: { enabled: !!activeWorkspaceId, queryKey: getGetDashboardMetricsQueryKey({ workspaceId: activeWorkspaceId }) } },
  );
  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });
  const { data: recommendations } = useListRecommendations({ workspaceId: activeWorkspaceId });
  const queryClient = useQueryClient();
  const dismissRec = useUpdateRecommendation();

  const unreadRecs = recommendations?.filter((r) => !r.isRead);
  const topRec = unreadRecs?.find((r) => r.priority === "high") ?? unreadRecs?.[0];
  const topCampaigns = campaigns?.slice(0, 3) ?? [];
  const hasCampaigns = (campaigns?.length ?? 0) > 0;
  const chartData = metrics
    ? [
        { name: "Spend", value: metrics.totalSpend / 1000 },
        { name: "Clicks", value: metrics.totalClicks / 100 },
        { name: "Conv.", value: metrics.totalConversions * 10 },
      ]
    : [];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-base">Here’s what needs your attention today.</p>
          </div>
          {!isViewer && (
            <Link href="/campaigns/new">
              <Button>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Campaign
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isMetricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : metrics ? (
            <>
              <Card><CardContent className="p-5 space-y-2"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Demo Spend</p><DollarSign className="h-4 w-4 text-muted-foreground" /></div><p className="text-3xl font-bold">${metrics.totalSpend.toLocaleString()}</p><p className="text-xs text-muted-foreground">Simulated · no real spend</p></CardContent></Card>
              <Card><CardContent className="p-5 space-y-2"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Clicks</p><MousePointerClick className="h-4 w-4 text-muted-foreground" /></div><p className="text-3xl font-bold">{metrics.totalClicks.toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg CTR {metrics.avgCtr.toFixed(2)}%</p></CardContent></Card>
              <Card><CardContent className="p-5 space-y-2"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Conversions</p><TrendingUp className="h-4 w-4 text-muted-foreground" /></div><p className="text-3xl font-bold">{metrics.totalConversions.toLocaleString()}</p><p className="text-xs text-muted-foreground">Best: <span className="font-medium capitalize text-foreground">{metrics.bestChannel}</span></p></CardContent></Card>
              <Card><CardContent className="p-5 space-y-2"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Health</p><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div><p className="text-3xl font-bold">Ready</p><p className="text-xs text-muted-foreground">Manual publish only</p></CardContent></Card>
            </>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {metrics ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No performance data yet.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Workflow Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {["Plan", "Create", "Review", "Ready", "Perform"].map((step, index) => (
                <div key={step} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{step}</span>
                  <Badge variant={index < 3 ? "secondary" : "outline"}>{index + 1}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" />Recent Campaigns</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isCampaignsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />) : topCampaigns.length > 0 ? topCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{campaign.objective}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{campaign.status}</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Brand Completion</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>Profile</span><Badge>Complete</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>Voice</span><Badge variant="outline">Review</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>Channels</span><Badge variant="outline">Review</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Pending Reviews</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>Ad copy draft</span><Badge variant="outline">1</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>Creative brief</span><Badge variant="outline">1</Badge></div>
            </CardContent>
          </Card>
        </div>

        <Card className={topRec ? "border-primary/30 bg-primary/5" : "border-dashed"}>
          <CardContent className="pt-6 pb-5">
            {topRec ? (
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Recent Activity</p>
                  <p className="text-lg font-semibold leading-snug">{topRec.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{topRec.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground text-xs"
                  disabled={dismissRec.isPending}
                  onClick={() => dismissRec.mutate({ id: topRec.id, data: { isRead: true } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRecommendationsQueryKey({ workspaceId: activeWorkspaceId }) }) })}
                >
                  Dismiss
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No recent activity yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}