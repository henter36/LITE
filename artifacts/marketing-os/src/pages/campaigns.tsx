import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListCampaigns } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Calendar, ArrowRight, Megaphone, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, string> = {
  active: "default",
  approved: "default",
  draft: "secondary",
  completed: "secondary",
  archived: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  active: "نشطة",
  approved: "معتمدة",
  draft: "مسودة",
  completed: "مكتملة",
  archived: "مؤرشفة",
};

const OBJECTIVE_LABEL: Record<string, string> = {
  awareness: "وعي",
  traffic: "زيارات",
  leads: "عملاء محتملون",
  sales: "مبيعات",
};

export default function Campaigns() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";
  const { data: campaigns, isLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });

  return (
    <SidebarLayout>
      <div className="space-y-6 overflow-x-hidden" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Megaphone className="h-3.5 w-3.5" />
            إدارة الحملات
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">الحملات</h1>
          <p className="text-muted-foreground mt-2 text-base">أدِر حملاتك التسويقية وجهّزها للنشر اليدوي.</p>
        </div>
        {!isViewer && (
          <Link href="/campaigns/new">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="ml-2 h-4 w-4" />
              حملة جديدة
            </Button>
          </Link>
        )}
      </div>

      {/* Viewer read-only indicator */}
      {isViewer && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-xl px-4 py-2.5 bg-muted/20">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">عرض للقراءة فقط.</span>{" "}
            يمكنك مشاهدة الحملات لكن لا يمكنك إنشاؤها أو تعديلها.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <Card className="border-dashed border-emerald-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-xl font-semibold mb-2">لا توجد حملات بعد</p>
            <p className="text-muted-foreground mb-6 max-w-sm">
              الحملة تجمع الموجز، المحتوى، الاعتماد، والتتبع في مكان واحد.
            </p>
            {!isViewer && (
              <Link href="/campaigns/new">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="ml-2 h-4 w-4" />
                  أنشئ أول حملة
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id} className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.22)] hover:bg-emerald-50/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                      <Megaphone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg leading-tight">{campaign.name}</h3>
                        <Badge
                          variant={(STATUS_COLOR[campaign.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"}
                          className="capitalize"
                        >
                          {STATUS_LABEL[campaign.status] ?? campaign.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/60 px-2.5 py-1">
                          <Target className="h-3.5 w-3.5" />
                          <span className="capitalize">{OBJECTIVE_LABEL[campaign.objective] ?? campaign.objective}</span>
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-2.5 py-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {campaign.startDate ? format(new Date(campaign.startDate), "MMM d") : "—"} –{" "}
                          {campaign.endDate ? format(new Date(campaign.endDate), "MMM d, yyyy") : "—"}
                        </span>
                      </div>
                      {campaign.channels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {campaign.channels.map((ch) => (
                            <Badge
                              key={ch}
                              variant="outline"
                              className="capitalize text-xs font-normal"
                            >
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm" className="shrink-0 border-emerald-200 text-emerald-700">
                      فتح
                      <ArrowRight className="mr-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}
