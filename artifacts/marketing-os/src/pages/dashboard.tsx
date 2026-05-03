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
import { ArrowRight, BarChart3, CheckCircle2, Clock3, CircleCheckBig, CircleDashed, CircleX, DollarSign, MousePointerClick, Plus, ShieldCheck, TrendingUp, Zap, Megaphone, Activity, Users, Bell, HelpCircle, ChevronDown, PanelRight, Goal, Flame, Sparkles } from "lucide-react";
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
  const kpis = metrics
    ? [
        { label: "إجمالي الحملات", value: metrics.totalSpend.toLocaleString(), note: "أعلى من الأسبوع الماضي", icon: Megaphone },
        { label: "قطع المحتوى المنشأة", value: metrics.totalClicks.toLocaleString(), note: "نمو ثابت", icon: Sparkles },
        { label: "المحتوى المعتمد", value: metrics.totalConversions.toLocaleString(), note: "تحسن في المراجعة", icon: CircleCheckBig },
        { label: "المحتوى المرفوض", value: Math.max(0, Math.round(metrics.totalConversions / 4)).toLocaleString(), note: "منخفض", icon: CircleX },
      ]
    : [];
  const stageRows = metrics
    ? [
        { label: "إجمالي الحملات", value: metrics.totalSpend.toLocaleString() },
        { label: "قيد التنفيذ", value: metrics.totalClicks.toLocaleString() },
        { label: "قيد المراجعة", value: Math.max(1, Math.round(metrics.totalConversions / 2)).toLocaleString() },
        { label: "معتمد", value: metrics.totalConversions.toLocaleString() },
        { label: "مرفوض", value: Math.max(0, Math.round(metrics.totalConversions / 4)).toLocaleString() },
      ]
    : [];
  const latestCampaigns = topCampaigns.slice(0, 3);
  const activityItems = recommendations?.slice(0, 3) ?? [];

  return (
    <SidebarLayout>
      <div className="space-y-6 overflow-x-hidden" dir="rtl">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><PanelRight className="h-4 w-4 text-emerald-600" />Marketing OS Lite</div>
                  <h1 className="text-4xl font-bold tracking-tight">مرحبًا، أحمد</h1>
                  <p className="max-w-2xl text-muted-foreground text-base">هذا ملخص أداء التسويق لليوم مع أحدث الحالات والمراجعات.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm"><ChevronDown className="h-4 w-4 text-muted-foreground" /> آخر 7 أيام</div>
                  </div>
                  <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm"><Bell className="h-4 w-4 text-muted-foreground" /> تنبيهات</div>
                  </div>
                  <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm"><HelpCircle className="h-4 w-4 text-muted-foreground" /> المساعدة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/15 bg-primary/5 shadow-sm">
            <CardContent className="p-4 flex h-full items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">مساحة العمل</p>
                <p className="font-semibold">{activeWorkspaceId || "workspace"}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ChevronDown className="h-4 w-4" /> تبديل</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isMetricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : metrics ? (
            <>
              {kpis.map((item, index) => {
                const Icon = item.icon;
                return <Card key={item.label} className="shadow-sm border-muted/60"><CardContent className="p-5 space-y-3"><div className="flex items-center justify-between"><div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Icon className="h-5 w-5" /></div><Badge variant={index === 3 ? "destructive" : "secondary"} className="rounded-full">{index === 3 ? "سلبي" : "إيجابي"}</Badge></div><p className="text-3xl font-bold leading-none">{item.value}</p><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>;
              })}
            </>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">أداء المحتوى (آخر 7 أيام)</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 h-[340px] space-y-4">
              {metrics ? (
                <>
                  <ResponsiveContainer width="100%" height="72%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="hsl(164 73% 35%)" radius={[10, 10, 10, 10]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {["الوصول", "معدل التفاعل", "النقرات", "التفاعلات"].map((item) => <div key={item} className="rounded-full border bg-muted/30 px-3 py-2 text-center">{item}</div>)}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No performance data yet.</div>
              )}
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2">مخطط سير العمل</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {stageRows.map((step, index) => (
                <div key={step.label} className="rounded-2xl border bg-gradient-to-r from-background to-muted/30 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between"><span className="font-medium">{step.label}</span><Badge variant={index < 3 ? "secondary" : "outline"}>{step.value}</Badge></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="min-w-0">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2">أحدث الحملات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isCampaignsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />) : latestCampaigns.length > 0 ? latestCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-3 rounded-2xl border px-3 py-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">تاريخ الإنشاء: {new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">{campaign.status === "approved" ? "نشطة" : campaign.status === "draft" ? "مسودة" : campaign.status === "archived" ? "مكتملة" : "تحتاج مراجعة"}</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">لا توجد حملات بعد.</p>}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2">اكتمال ملف العلامة التجارية</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>الملف</span><Badge>مكتمل</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>الصوت</span><Badge variant="outline">قيد المراجعة</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>القنوات</span><Badge variant="outline">قيد المراجعة</Badge></div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2">المراجعات المعلقة</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>مسودة إعلان</span><Badge variant="outline">1</Badge></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span>موجز الحملة النشطة</span><Badge variant="outline">1</Badge></div>
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
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">النشاط الأخير</p>
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
                  إخفاء
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">لا يوجد نشاط حديث بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}