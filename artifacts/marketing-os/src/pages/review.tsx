import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useListCampaigns, useListBrandProfiles, useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { useQuery as useApiQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ShieldCheck, AlertCircle, History, FileText, EyeOff } from "lucide-react";

type TextSuggestion = {
  id: number;
  campaignName?: string | null;
  source: string;
  status: string;
  hooks?: string[];
  safetyNotes?: string[];
  missingContextWarnings?: string[];
  createdAt: string;
};

async function fetchTextSuggestions(workspaceId: number) {
  const res = await fetch(`/api/strategy/text-suggestions?workspaceId=${workspaceId}`, { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

export default function Review() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";
  const { data: campaigns } = useListCampaigns({ workspaceId: activeWorkspaceId });
  const { data: brandProfiles } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const { data: auditPage, isLoading: auditLoading } = useListAuditLogs(
    { workspaceId: activeWorkspaceId, limit: 10, search: undefined },
    { query: { enabled: !!activeWorkspaceId, queryKey: getListAuditLogsQueryKey({ workspaceId: activeWorkspaceId, limit: 10 }) } },
  );
  const { data: suggestions, isLoading } = useApiQuery({
    queryKey: ["review-text-suggestions", activeWorkspaceId],
    queryFn: () => fetchTextSuggestions(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
  });

  const queue = useMemo(() => (suggestions ?? []) as TextSuggestion[], [suggestions]);
  const latest = queue[0];

  return (
    <SidebarLayout>
      <div className="space-y-6 rtl text-right">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                شاشة مراجعة مسودة فقط
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">المراجعة</h1>
                <p className="mt-2 text-base text-muted-foreground">راجع النصوص المحفوظة قبل أي اعتماد بشري.</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Draft-only</Badge>
          </div>
        </div>

        {isViewer && (
          <Alert className="border-amber-500/30 bg-amber-50/60">
            <EyeOff className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">قراءة فقط</AlertTitle>
            <AlertDescription>المشاهد لا يمكنه الاعتماد أو طلب التعديل أو الرفض.</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
        ) : queue.length === 0 ? (
          <Card className="border-dashed border-emerald-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-emerald-300" />
              <p className="mb-1 text-lg font-semibold">لا توجد عناصر مراجعة بعد</p>
              <p className="text-sm text-muted-foreground">لا توجد مقترحات محفوظة قابلة للمراجعة حالياً.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle>طابور المراجعة</CardTitle>
                <CardDescription>campaign_text_suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {queue.map((item) => (
                  <button key={item.id} className="w-full rounded-2xl border border-emerald-100 bg-white p-3 text-right shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{item.campaignName || "حملة غير مسماة"}</p>
                        <p className="text-xs text-muted-foreground">{item.source} · {item.status}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Draft</Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle>معاينة المراجعة</CardTitle>
                <CardDescription>المحتوى المحفوظ الفعلي فقط</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {latest ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Draft-only</Badge>
                      <Badge variant="outline">{latest.source}</Badge>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="font-semibold">{latest.campaignName || "غير متاح"}</p>
                      <p className="text-sm text-muted-foreground">Content type</p>
                      <p className="font-semibold">Stage 3 text suggestions</p>
                      <p className="text-sm text-muted-foreground">Generated date</p>
                      <p className="font-semibold">{latest.createdAt}</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Draft content</p>
                        <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                          {(latest.hooks?.[0] ?? "لا توجد نسخة محفوظة").toString()}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Safety notes</p>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700">
                          {latest.safetyNotes?.length ? latest.safetyNotes.join(" · ") : "لا توجد ملاحظات سلامة."}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Missing context warnings</p>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700">
                          {latest.missingContextWarnings?.length ? latest.missingContextWarnings.join(" · ") : "لا توجد تحذيرات."}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">لا يوجد عنصر محدد.</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">إجراءات المراجعة</h2>
                <p className="text-sm text-muted-foreground">اعتماد / طلب تعديل / رفض محفوظة ومقيدة بصلاحيات الخادم، ولا يتم تفعيلها هنا بشكل وهمي.</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={isViewer || true}>اعتماد</Button>
                <Button className="w-full" variant="outline" disabled={isViewer || true}>طلب تعديل</Button>
                <Button className="w-full" variant="outline" disabled={isViewer || true}>رفض</Button>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">الجدول الزمني</h2>
                <p className="text-sm text-muted-foreground">{auditLoading ? "..." : auditPage?.items?.length ? "سجل مراجعات/نشاط متاح." : "لا توجد أحداث مراجعة مسجلة بعد."}</p>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">القيود</h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">لا يوجد نشر مباشر</li>
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">لا توجد موافقة تلقائية</li>
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">لا يتم تغيير readiness أو budget</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}