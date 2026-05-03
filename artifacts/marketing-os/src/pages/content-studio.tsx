import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListCampaigns,
  useListAssets,
  useCreateApproval,
  useUpdateAssetBrief,
  useListBrandProfiles,
  useGetAssetVariants,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Check,
  PenTool,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  BadgeInfo,
  Flame,
} from "lucide-react";
import { Link as WouterLink, useSearch } from "wouter";
import { useQuery as useApiQuery } from "@tanstack/react-query";

function countGuardrails(forbiddenClaims: string): number {
  if (!forbiddenClaims.trim()) return 0;
  return forbiddenClaims
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5).length;
}

type Asset = {
  id: number;
  headline: string;
  shortCaption: string;
  hashtags: string[];
  cta: string;
  imageBrief?: string | null;
  videoBrief?: string | null;
  assetReference?: string | null;
  videoScript?: string | null;
  storyboardOutline?: string | null;
  status: string;
};

type TextSuggestion = {
  id: number;
  campaignId: number;
  campaignName?: string | null;
  campaignObjective?: string | null;
  campaignChannels?: string[];
  source: string;
  status: string;
  hooks: string[];
  adCopyVariants: string[];
  captions: string[];
  ctas: string[];
  improvementNotes: string[];
  missingContextWarnings: string[];
  safetyNotes: string[];
  createdAt: string;
  updatedAt: string;
};

const PLATFORM_TABS = [
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
] as const;

type PlatformId = (typeof PLATFORM_TABS)[number]["id"];

function VariantTabPanel({
  assetId,
  videoScript,
  storyboardOutline,
}: {
  assetId: number;
  videoScript?: string | null;
  storyboardOutline?: string | null;
}) {
  const [activeChannel, setActiveChannel] = useState<PlatformId>("instagram");
  const { data: variants, isLoading } = useGetAssetVariants(assetId);
  const variant = variants?.find((v) => v.channel === activeChannel);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto border-b border-emerald-100 pb-2">
        {PLATFORM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChannel(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              activeChannel === tab.id
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      ) : variant ? (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hook</p>
            <p className="font-bold leading-snug">{variant.headline}</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">نص الإعلان</p>
            <p className="text-sm leading-relaxed">{variant.caption}</p>
          </div>
          {variant.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {variant.hashtags.map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">CTA</span>
            <span className="text-sm font-medium">{variant.cta}</span>
          </div>

          {activeChannel === "tiktok" && (videoScript || storyboardOutline) && (
            <div className="space-y-4 rounded-xl border border-dashed border-emerald-100 bg-white/70 p-4">
              {videoScript && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Video Script</p>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">{videoScript}</pre>
                </div>
              )}
              {storyboardOutline && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Storyboard Outline</p>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">{storyboardOutline}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">لا توجد نسخة جاهزة بعد. حاول التحديث أو الرجوع للحملة.</p>
      )}
    </div>
  );
}

async function fetchTextSuggestions(workspaceId: number, campaignId?: number): Promise<TextSuggestion[]> {
  const params = new URLSearchParams({ workspaceId: String(workspaceId) });
  if (campaignId) params.set("campaignId", String(campaignId));
  const response = await fetch(`/api/strategy/text-suggestions?${params.toString()}`, { credentials: "include" });
  if (!response.ok) return [];
  return response.json();
}

function CreativeBriefPanel({
  assetId,
  initialImageBrief,
  initialVideoBrief,
  initialAssetReference,
  isViewer,
}: {
  assetId: number;
  initialImageBrief?: string | null;
  initialVideoBrief?: string | null;
  initialAssetReference?: string | null;
  isViewer: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [imageBrief, setImageBrief] = useState(initialImageBrief ?? "");
  const [videoBrief, setVideoBrief] = useState(initialVideoBrief ?? "");
  const [assetReference, setAssetReference] = useState(initialAssetReference ?? "");
  const [saved, setSaved] = useState(false);
  const updateBrief = useUpdateAssetBrief();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hasBriefContent = !!(initialImageBrief || initialVideoBrief || initialAssetReference);

  const handleSave = () => {
    updateBrief.mutate(
      {
        id: assetId,
        data: {
          imageBrief: imageBrief || undefined,
          videoBrief: videoBrief || undefined,
          assetReference: assetReference || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          toast({ title: "تم حفظ الملخص" });
        },
        onError: () => {
          toast({ title: "تعذر حفظ الملخص", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="border-t border-emerald-100 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-right group"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ملخص الإبداع</p>
          {hasBriefContent && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">متاح</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">هذه حقول نصية فقط لتوجيه الفريق الإبداعي.</p>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <BadgeInfo className="h-3.5 w-3.5" />
              ملاحظات الصورة
            </Label>
            <Textarea value={imageBrief} onChange={(e) => setImageBrief(e.target.value)} rows={3} className="resize-none text-sm" disabled={isViewer} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Flame className="h-3.5 w-3.5" />
              ملاحظات الفيديو
            </Label>
            <Textarea value={videoBrief} onChange={(e) => setVideoBrief(e.target.value)} rows={3} className="resize-none text-sm" disabled={isViewer} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Search className="h-3.5 w-3.5" />
              مرجع أو رابط
            </Label>
            <Input value={assetReference} onChange={(e) => setAssetReference(e.target.value)} className="text-sm" disabled={isViewer} />
          </div>

          {!isViewer && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={updateBrief.isPending || saved}>
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                  تم الحفظ
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {updateBrief.isPending ? "جارٍ الحفظ…" : "حفظ الملخص"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ContentItemCard({ title, items, badge }: { title: string; items: string[]; badge: string }) {
  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm">
      <CardHeader className="space-y-2 border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">{badge}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">مسودة • تحتاج مراجعة • مولّدة بالذكاء الاصطناعي</p>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {items.length ? items.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-emerald-50 bg-white p-4 text-sm leading-relaxed text-slate-700">
            {item}
          </div>
        )) : <p className="text-sm text-muted-foreground">لا توجد بيانات متاحة.</p>}
      </CardContent>
    </Card>
  );
}

export default function ContentStudio() {
  const { activeWorkspaceId, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isViewer = user?.role === "viewer";
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const preselectedId = searchParams.get("campaignId") ?? "";
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(preselectedId);
  const [editDialogAssetId, setEditDialogAssetId] = useState<number | null>(null);
  const [editReason, setEditReason] = useState<string>("");

  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });
  const { data: brandProfiles, isLoading: isBrandLoading } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const brandProfile = brandProfiles?.[0];
  const campaignIdNum = selectedCampaignId ? parseInt(selectedCampaignId, 10) : undefined;

  const { data: textSuggestions, isLoading: isSuggestionsLoading } = useApiQuery({
    queryKey: ["text-suggestions", activeWorkspaceId, campaignIdNum],
    queryFn: () => fetchTextSuggestions(activeWorkspaceId, campaignIdNum),
    enabled: !!activeWorkspaceId && !!campaignIdNum,
  });

  const createApproval = useCreateApproval();

  const selectedCampaign = campaigns?.find((c) => c.id === campaignIdNum);
  const guardrailCount = brandProfile ? countGuardrails(brandProfile.forbiddenClaims ?? "") : 0;
  const cameFromCampaign = !!preselectedId;
  const latestSuggestion = textSuggestions?.[0];
  const connectedToStage3 = !!latestSuggestion;
  const filters = useMemo(() => ["الحملة", "القناة", "الحالة", "اللغة", "الهدف"], []);
  const handleGenerate = () => {
    toast({ title: "المحتوى مسودة فقط", description: "توليد المحتوى غير مفعّل في هذه الشريحة." });
  };

  const handleDecision = (assetId: number, decision: "approved" | "rejected" | "changes_requested", reason?: string) => {
    createApproval.mutate(
      {
        data: { assetId, decision, actor: "Demo User", reason: reason ?? "" },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum ?? 0 }) });
          const label = decision === "approved" ? "تمت الموافقة" : decision === "changes_requested" ? "تم طلب تعديل" : "تم الرفض";
          toast({ title: label });
        },
      },
    );
  };

  const handleSubmitEdit = () => {
    if (editDialogAssetId === null) return;
    handleDecision(editDialogAssetId, "changes_requested", editReason.trim() || "يرجى المراجعة");
    setEditDialogAssetId(null);
    setEditReason("");
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 rtl text-right">
        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                مساحة نصية أولاً
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">المحتوى</h1>
                <p className="mt-2 text-base text-muted-foreground">راجع النصوص والمقترحات الإعلانية المرتبطة بالحملات</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isViewer ? (
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">قراءة فقط</Badge>
              ) : (
                <Button onClick={handleGenerate} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  إجراء مراجعة نصية
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {filters.map((label) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                  <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm text-slate-500">تصفية محلية</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCampaignId && !isBrandLoading && !brandProfile && (
          <Alert className="border-amber-500/40 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-500">لا يوجد ملف علامة تجارية</AlertTitle>
            <AlertDescription className="text-amber-700/80 dark:text-amber-400/80">قد تظهر النصوص عامة أكثر من اللازم.</AlertDescription>
          </Alert>
        )}

        {selectedCampaignId && brandProfile && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>صوت العلامة:</span>
            <span className="font-semibold text-slate-900">{brandProfile.brandName}</span>
            {guardrailCount > 0 && <span>· {guardrailCount} ملاحظة سلامة</span>}
          </div>
        )}

        {!selectedCampaignId ? (
          <Card className="border-dashed border-emerald-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PenTool className="mb-3 h-10 w-10 text-emerald-300" />
              <p className="mb-1 text-lg font-semibold">اختر حملة للبدء</p>
              <p className="text-sm text-muted-foreground">سيتم عرض النصوص الجاهزة هنا عندما تتوفر.</p>
            </CardContent>
          </Card>
        ) : isSuggestionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              {!connectedToStage3 && (
                <Alert className="border-emerald-100 bg-white">
                  <AlertTitle>Content screen is connected to persisted stage 3 text suggestions.</AlertTitle>
                  <AlertDescription>
                    لا تزال الشاشة draft-only وتعرض أحدث مقترحات النص المحفوظة للمراجعة البشرية فقط.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <ContentItemCard title="Hooks" badge="مسودة" items={latestSuggestion?.hooks ?? []} />
                <ContentItemCard title="Ad copy variants" badge="تحتاج مراجعة" items={latestSuggestion?.adCopyVariants ?? []} />
                <ContentItemCard title="Captions" badge="مولّدة بالذكاء الاصطناعي" items={latestSuggestion?.captions ?? []} />
                <ContentItemCard title="CTAs" badge="مسودة" items={latestSuggestion?.ctas ?? []} />
                <ContentItemCard title="Improvement notes" badge="تحتاج مراجعة" items={latestSuggestion?.improvementNotes ?? []} />
                <ContentItemCard title="Safety notes" badge="مسودة" items={latestSuggestion?.safetyNotes ?? []} />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">ملخص صوت العلامة</h2>
                <p className="text-sm text-muted-foreground">{brandProfile?.toneOfVoice || "لا توجد بيانات نبرة متاحة حالياً."}</p>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">آخر حالة محفوظة</h2>
                <p className="text-sm text-muted-foreground">{latestSuggestion ? `${latestSuggestion.source} • ${latestSuggestion.status}` : "لا توجد مقترحات محفوظة لهذه الحملة بعد."}</p>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">جودة المحتوى</h2>
                <p className="text-sm text-muted-foreground">مستوى المراجعة الحالي: مسودة داخلية تحتاج اعتماداً بشرياً.</p>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">توصيات مراجعة</h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">راجع التناسق مع الحملة المحددة</li>
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">تحقق من الملاءمة للغة العربية RTL</li>
                  <li className="rounded-xl bg-emerald-50/70 px-3 py-2">اعتمد النص فقط بعد المراجعة البشرية</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">ملاحظات السلامة</h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">لا يوجد نشر مباشر</li>
                  <li className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">لا يوجد اعتماد تلقائي</li>
                  <li className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">لا توجد وسائط أو رفع ملفات</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedCampaign && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              بعد مراجعة النصوص، ارجع إلى{" "}
              <WouterLink href={`/campaigns/${selectedCampaign.id}`} className="font-semibold text-emerald-700 hover:underline">
                {selectedCampaign.name}
              </WouterLink>{" "}
              لإكمال خطوات الحملة يدويًا.
            </span>
          </div>
        )}
      </div>

      <Dialog
        open={editDialogAssetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogAssetId(null);
            setEditReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب تعديل</DialogTitle>
            <DialogDescription>اكتب ما الذي تريد تحسينه في هذه المسودة.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogAssetId(null); setEditReason(""); }}>إلغاء</Button>
            <Button onClick={handleSubmitEdit} disabled={createApproval.isPending}>إرسال الملاحظة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
