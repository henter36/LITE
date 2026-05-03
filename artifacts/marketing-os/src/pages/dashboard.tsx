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
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <SidebarLayout>
      <div className="space-y-6 overflow-x-hidden" dir="rtl">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="border-emerald-200/60 bg-gradient-to-br from-white via-white to-emerald-50/50 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]">
            <CardContent className="p-6 md:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <PanelRight className="h-3.5 w-3.5" />
                    Marketing OS Lite
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">مرحبًا، أحمد</h1>
                    <p className="max-w-2xl text-base md:text-lg leading-8 text-slate-500">هذا ملخص أداء التسويق لليوم مع أحدث الحالات والمراجعات.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-700"><ChevronDown className="h-4 w-4 text-emerald-600" /> آخر 7 أيام</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Bell className="h-4 w-4 text-emerald-600" /> تنبيهات</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-700"><HelpCircle className="h-4 w-4 text-emerald-600" /> المساعدة</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-white shadow-[0_14px_30px_-28px_rgba(15,23,42,0.35)]">
            <CardContent className="flex h-full items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">مساحة العمل</p>
                <p className="text-lg font-semibold text-slate-900">{activeWorkspaceId || "workspace"}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <ChevronDown className="h-4 w-4" /> تبديل
              </div>
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
                return (
                  <Card key={item.label} className="border-emerald-100/70 bg-white shadow-[0_14px_28px_-24px_rgba(15,23,42,0.35)]">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 3 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant={index === 3 ? "destructive" : "outline"}
                          className={`rounded-full border-0 px-3 py-1 ${index === 3 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
                        >
                          {index === 3 ? "تنبيه" : "إيجابي"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{item.value}</p>
                        <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                        <p className="text-xs leading-6 text-slate-500">{item.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card className="min-w-0 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                أداء المحتوى (آخر 7 أيام)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
              {metrics ? (
                <>
                  <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white p-4">
                    <svg viewBox="0 0 640 240" className="h-[260px] w-full">
                      <defs>
                        <linearGradient id="contentTrend" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(16,185,129,0.35)" />
                          <stop offset="100%" stopColor="rgba(16,185,129,0.02)" />
                        </linearGradient>
                      </defs>
                      <g>
                        {[0, 1, 2, 3].map((row) => (
                          <line key={row} x1="24" x2="616" y1={40 + row * 48} y2={40 + row * 48} stroke="rgba(16,185,129,0.12)" />
                        ))}
                      </g>
                      <path
                        d="M 24 182 C 72 174, 112 158, 160 150 C 208 141, 248 160, 296 132 C 344 104, 384 112, 432 88 C 480 64, 528 80, 592 46"
                        fill="none"
                        stroke="rgba(16,185,129,0.95)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 24 182 C 72 174, 112 158, 160 150 C 208 141, 248 160, 296 132 C 344 104, 384 112, 432 88 C 480 64, 528 80, 592 46 L 592 220 L 24 220 Z"
                        fill="url(#contentTrend)"
                      />
                      {[
                        [24, 182],
                        [160, 150],
                        [296, 132],
                        [432, 88],
                        [592, 46],
                      ].map(([x, y], index) => (
                        <circle key={index} cx={x} cy={y} r="5" fill="white" stroke="rgb(16,185,129)" strokeWidth="3" />
                      ))}
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {["الوصول", "معدل التفاعل", "النقرات", "التفاعلات"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-full px-3 py-2 text-center font-medium ${index === 1 ? "bg-teal-50 text-teal-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">No performance data yet.</div>
              )}
            </CardContent>
          </Card>
          <Card className="min-w-0 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Goal className="h-5 w-5 text-emerald-600" />
                مخطط سير العمل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {stageRows.map((step, index) => (
                <div
                  key={step.label}
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${
                    index === 0
                      ? "border-emerald-100 bg-gradient-to-r from-emerald-50 to-white"
                      : index === 1
                        ? "border-teal-100 bg-gradient-to-r from-teal-50 to-white"
                        : index === 2
                          ? "border-amber-100 bg-gradient-to-r from-amber-50 to-white"
                          : index === 3
                            ? "border-emerald-200 bg-gradient-to-r from-emerald-100/80 to-white"
                            : "border-rose-100 bg-gradient-to-r from-rose-50 to-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">{step.label}</span>
                    <Badge
                      variant={index < 3 ? "outline" : index === 4 ? "destructive" : "secondary"}
                      className={`rounded-full ${index === 4 ? "border-0 bg-rose-100 text-rose-700" : "border-emerald-100 bg-white text-slate-700"}`}
                    >
                      {step.value}
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${
                        index === 0 ? "bg-emerald-400" : index === 1 ? "bg-teal-400" : index === 2 ? "bg-amber-400" : index === 3 ? "bg-emerald-500" : "bg-rose-400"
                      }`}
                      style={{ width: `${84 - index * 12}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_0.9fr]">
          <Card className="min-w-0 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Users className="h-5 w-5 text-emerald-600" />
                أحدث الحملات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isCampaignsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />) : latestCampaigns.length > 0 ? latestCampaigns.map((campaign, index) => (
                <div key={campaign.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${index === 0 ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white"}`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{campaign.name}</p>
                    <p className="text-xs leading-6 text-slate-500">تاريخ الإنشاء: {new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full border px-3 py-1 ${campaign.status === "approved" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : campaign.status === "draft" ? "border-slate-200 bg-slate-50 text-slate-600" : campaign.status === "archived" ? "border-teal-100 bg-teal-50 text-teal-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}
                  >
                    {campaign.status === "approved" ? "نشطة" : campaign.status === "draft" ? "مسودة" : campaign.status === "archived" ? "مكتملة" : "تحتاج مراجعة"}
                  </Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">لا توجد حملات بعد.</p>}
            </CardContent>
          </Card>

          <Card className="min-w-0 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                اكتمال ملف العلامة التجارية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-emerald-100 border-t-emerald-500 bg-white text-sm font-semibold text-emerald-700">
                  73%
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2"><span className="font-medium">الملف</span><Badge className="rounded-full bg-white text-emerald-700">مكتمل</Badge></div>
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-3 py-2"><span className="font-medium">الصوت</span><Badge variant="outline" className="rounded-full border-emerald-100 text-slate-700">قيد المراجعة</Badge></div>
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-3 py-2"><span className="font-medium">القنوات</span><Badge variant="outline" className="rounded-full border-emerald-100 text-slate-700">قيد المراجعة</Badge></div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Clock3 className="h-5 w-5 text-emerald-600" />
                المراجعات المعلقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-3 py-3 shadow-sm"><span className="font-medium text-slate-800">مسودة إعلان</span><Badge variant="outline" className="rounded-full border-emerald-100 text-slate-700">1</Badge></div>
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-3 py-3 shadow-sm"><span className="font-medium text-slate-800">موجز الحملة النشطة</span><Badge variant="outline" className="rounded-full border-emerald-100 text-slate-700">1</Badge></div>
            </CardContent>
          </Card>
        </div>

        <Card className={topRec ? "border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]" : "border-dashed"}>
          <CardContent className="pt-6 pb-5">
            {topRec ? (
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">النشاط الأخير</p>
                  <p className="text-lg font-semibold leading-snug text-slate-900">{topRec.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{topRec.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-500"
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