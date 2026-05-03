import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  ClipboardList,
  Target,
  PenTool,
  Image,
  Video,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Rocket,
  BookOpen,
  Layers,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowIntake {
  businessDescription: string;
  campaignObjective: string;
  targetAudience: string;
  offerValueProposition: string;
  brandTone: string;
  landingUrl: string;
  constraintsForbiddenClaims: string;
  availableCreativeAssets: string;
  missingInformation: string;
}

export interface WorkflowStrategyBrief {
  objective: string;
  targetAudience: string;
  positioning: string;
  keyMessage: string;
  recommendedChannels: string[];
  contentAngles: string[];
  ctaDirection: string;
  requiredAssets: string[];
  missingContextWarnings: string[];
  risksSafetyNotes: string[];
}

export interface WorkflowCreativeBrief {
  coreMessage: string;
  audience: string;
  tone: string;
  textDirection: string;
  visualDirection: string;
  videoDirection: string;
  channelAdaptations: string[];
  usageRightsReminders: string[];
  prohibitedElements: string[];
}

export interface WorkflowImagePromptSpecs {
  imagePrompts: string[];
  compositionNotes: string;
  styleDirection: string;
  productSceneNotes: string;
  channelFormatNotes: string[];
  usageRightsReminders: string[];
}

export interface WorkflowVideoScriptSpecs {
  videoConcept: string;
  shortScript: string;
  storyboardOutline: string;
  sceneList: string[];
  voiceoverDraft: string;
  captionDraft: string;
  platformAspectRatioNotes: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

async function wfFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function parseJsonField<T>(value: string | T[]): T[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStrategyBrief(raw: Record<string, unknown>): WorkflowStrategyBrief {
  return {
    objective: String(raw.objective ?? ""),
    targetAudience: String(raw.targetAudience ?? raw.target_audience ?? ""),
    positioning: String(raw.positioning ?? ""),
    keyMessage: String(raw.keyMessage ?? raw.key_message ?? ""),
    recommendedChannels: parseJsonField(raw.recommendedChannels as string ?? raw.recommended_channels as string ?? "[]"),
    contentAngles: parseJsonField(raw.contentAngles as string ?? raw.content_angles as string ?? "[]"),
    ctaDirection: String(raw.ctaDirection ?? raw.cta_direction ?? ""),
    requiredAssets: parseJsonField(raw.requiredAssets as string ?? raw.required_assets as string ?? "[]"),
    missingContextWarnings: parseJsonField(raw.missingContextWarnings as string ?? raw.missing_context_warnings as string ?? "[]"),
    risksSafetyNotes: parseJsonField(raw.risksSafetyNotes as string ?? raw.risks_safety_notes as string ?? "[]"),
  };
}

function normalizeCreativeBrief(raw: Record<string, unknown>): WorkflowCreativeBrief {
  return {
    coreMessage: String(raw.coreMessage ?? raw.core_message ?? ""),
    audience: String(raw.audience ?? ""),
    tone: String(raw.tone ?? ""),
    textDirection: String(raw.textDirection ?? raw.text_direction ?? ""),
    visualDirection: String(raw.visualDirection ?? raw.visual_direction ?? ""),
    videoDirection: String(raw.videoDirection ?? raw.video_direction ?? ""),
    channelAdaptations: parseJsonField(raw.channelAdaptations as string ?? raw.channel_adaptations as string ?? "[]"),
    usageRightsReminders: parseJsonField(raw.usageRightsReminders as string ?? raw.usage_rights_reminders as string ?? "[]"),
    prohibitedElements: parseJsonField(raw.prohibitedElements as string ?? raw.prohibited_elements as string ?? "[]"),
  };
}

function normalizeImagePromptSpecs(raw: Record<string, unknown>): WorkflowImagePromptSpecs {
  return {
    imagePrompts: parseJsonField(raw.imagePrompts as string ?? raw.image_prompts as string ?? "[]"),
    compositionNotes: String(raw.compositionNotes ?? raw.composition_notes ?? ""),
    styleDirection: String(raw.styleDirection ?? raw.style_direction ?? ""),
    productSceneNotes: String(raw.productSceneNotes ?? raw.product_scene_notes ?? ""),
    channelFormatNotes: parseJsonField(raw.channelFormatNotes as string ?? raw.channel_format_notes as string ?? "[]"),
    usageRightsReminders: parseJsonField(raw.usageRightsReminders as string ?? raw.usage_rights_reminders as string ?? "[]"),
  };
}

function normalizeVideoScriptSpecs(raw: Record<string, unknown>): WorkflowVideoScriptSpecs {
  return {
    videoConcept: String(raw.videoConcept ?? raw.video_concept ?? ""),
    shortScript: String(raw.shortScript ?? raw.short_script ?? ""),
    storyboardOutline: String(raw.storyboardOutline ?? raw.storyboard_outline ?? ""),
    sceneList: parseJsonField(raw.sceneList as string ?? raw.scene_list as string ?? "[]"),
    voiceoverDraft: String(raw.voiceoverDraft ?? raw.voiceover_draft ?? ""),
    captionDraft: String(raw.captionDraft ?? raw.caption_draft ?? ""),
    platformAspectRatioNotes: parseJsonField(raw.platformAspectRatioNotes as string ?? raw.platform_aspect_ratio_notes as string ?? "[]"),
  };
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function DraftBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      مسودة فقط — تتطلب مراجعة بشرية قبل الاستخدام. لا تعتمد أو تنشر مباشرةً من مخرجات الذكاء الاصطناعي.
    </div>
  );
}

function GovernanceBanner() {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-600 space-y-0.5">
      <p>• مخرجات الذكاء الاصطناعي <strong>مسودة فقط</strong>.</p>
      <p>• لا يتم اعتماد المحتوى أو نشر الحملة تلقائياً.</p>
      <p>• يجب مراجعة النتائج قبل استخدامها.</p>
    </div>
  );
}

function SectionList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">لا توجد عناصر.</p>;
  return (
    <ul className="space-y-1 text-sm text-muted-foreground list-disc pr-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CollapseCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-right"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function UnavailableBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-400">
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
  );
}

function StatusBadge({ stageStatus }: { stageStatus: StageStatus }) {
  const map: Record<StageStatus, { label: string; cls: string }> = {
    not_started: { label: "لم يبدأ", cls: "text-slate-500 border-slate-200 bg-slate-50" },
    saved:        { label: "تم الحفظ", cls: "text-blue-700 border-blue-200 bg-blue-50" },
    draft:        { label: "مسودة", cls: "text-amber-700 border-amber-300 bg-amber-50" },
    generated:    { label: "مكتمل", cls: "text-emerald-700 border-emerald-200 bg-emerald-50" },
  };
  const { label, cls } = map[stageStatus];
  return <Badge variant="outline" className={cls}>{label}</Badge>;
}

type StageStatus = "not_started" | "saved" | "draft" | "generated";

// ── Compact result card ────────────────────────────────────────────────────────

function CompactResultCard({
  summary,
  onExpand,
}: {
  summary: string;
  onExpand: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          مسودة مولّدة
        </div>
        <p className="text-sm text-slate-700 line-clamp-2">{summary}</p>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={onExpand}>
        عرض التفاصيل
      </Button>
    </div>
  );
}

// ── Stage wrapper ─────────────────────────────────────────────────────────────

function StageCard({
  index,
  title,
  subtitle,
  icon: Icon,
  stageStatus,
  isActive,
  onActivate,
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  stageStatus: StageStatus;
  isActive: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border transition-all ${isActive ? "border-emerald-200 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] bg-white" : "border-slate-100 bg-slate-50/40"}`}>
      <button
        type="button"
        className="w-full flex items-center gap-4 p-5 text-right"
        onClick={onActivate}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${isActive ? "text-slate-900" : "text-slate-600"}`}>{title}</span>
            <StatusBadge stageStatus={stageStatus} />
          </div>
          {!isActive && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
        {isActive ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>
      {isActive && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Stage 1 content: فهم الحملة ───────────────────────────────────────────────

function Stage1Content({
  workspaceId,
  campaignId,
  isViewer,
  onSaved,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<WorkflowIntake>({
    businessDescription: "",
    campaignObjective: "",
    targetAudience: "",
    offerValueProposition: "",
    brandTone: "",
    landingUrl: "",
    constraintsForbiddenClaims: "",
    availableCreativeAssets: "",
    missingInformation: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    wfFetch(`/api/campaign-workflow/intake?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        setForm({
          businessDescription: String(b.businessDescription ?? b.business_description ?? ""),
          campaignObjective: String(b.campaignObjective ?? b.campaign_objective ?? ""),
          targetAudience: String(b.targetAudience ?? b.target_audience ?? ""),
          offerValueProposition: String(b.offerValueProposition ?? b.offer_value_proposition ?? ""),
          brandTone: String(b.brandTone ?? b.brand_tone ?? ""),
          landingUrl: String(b.landingUrl ?? b.landing_url ?? ""),
          constraintsForbiddenClaims: String(b.constraintsForbiddenClaims ?? b.constraints_forbidden_claims ?? ""),
          availableCreativeAssets: String(b.availableCreativeAssets ?? b.available_creative_assets ?? ""),
          missingInformation: String(b.missingInformation ?? b.missing_information ?? ""),
        });
        setSaved(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (isViewer) return;
    setLoading(true);
    setError(null);
    const { ok, body } = await wfFetch("/api/campaign-workflow/intake", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId, ...form }),
    });
    setLoading(false);
    if (ok) {
      setSaved(true);
      onSaved();
    } else {
      setError((body as { error?: string }).error ?? "Failed to save intake.");
    }
  };

  const set = (field: keyof WorkflowIntake) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        أدخل سياق الحملة لتغذية جميع المراحل اللاحقة — الاستراتيجية والمحتوى والمواصفات الإبداعية.
      </p>
      {error && <ErrorBanner message={error} />}
      {saved && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> تم حفظ المدخلات
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>وصف النشاط أو المنتج</Label>
          <Textarea
            value={form.businessDescription}
            onChange={set("businessDescription")}
            placeholder="ماذا يقدم النشاط؟ وما المشكلة التي يحلها؟"
            rows={2}
            className="resize-none"
            disabled={isViewer}
          />
        </div>
        <div className="space-y-1.5">
          <Label>هدف الحملة</Label>
          <Input value={form.campaignObjective} onChange={set("campaignObjective")} placeholder="مثال: عملاء محتملون، مبيعات، وعي بالعلامة" disabled={isViewer} />
        </div>
        <div className="space-y-1.5">
          <Label>الجمهور المستهدف</Label>
          <Input value={form.targetAudience} onChange={set("targetAudience")} placeholder="مثال: أصحاب المشاريع الصغيرة من 25 إلى 40 عاماً" disabled={isViewer} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>العرض / القيمة المقترحة</Label>
          <Input value={form.offerValueProposition} onChange={set("offerValueProposition")} placeholder="ما العرض أو القيمة التي تريد إيصالها؟" disabled={isViewer} />
        </div>
        <div className="space-y-1.5">
          <Label>نبرة العلامة</Label>
          <Input value={form.brandTone} onChange={set("brandTone")} placeholder="مثال: احترافية، جريئة، ودودة" disabled={isViewer} />
        </div>
        <div className="space-y-1.5">
          <Label>رابط التتبع أو صفحة الهبوط</Label>
          <Input value={form.landingUrl} onChange={set("landingUrl")} placeholder="https://…" disabled={isViewer} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>القيود / الادعاءات الممنوعة</Label>
          <Textarea
            value={form.constraintsForbiddenClaims}
            onChange={set("constraintsForbiddenClaims")}
            placeholder="مثال: لا تذكر المنافسين. تجنب عبارات مثل «نتائج مضمونة»."
            rows={2}
            className="resize-none"
            disabled={isViewer}
          />
        </div>
        <div className="space-y-1.5">
          <Label>الأصول الإبداعية / المراجع المتاحة</Label>
          <Textarea
            value={form.availableCreativeAssets}
            onChange={set("availableCreativeAssets")}
            placeholder="مثال: صور المنتج، رابط دليل الهوية، مراجع حملات سابقة"
            rows={2}
            className="resize-none"
            disabled={isViewer}
          />
        </div>
        <div className="space-y-1.5">
          <Label>معلومات ناقصة أو سياق إضافي</Label>
          <Textarea
            value={form.missingInformation}
            onChange={set("missingInformation")}
            placeholder="ما السياق غير المتوفر بعد لهذه الحملة؟"
            rows={2}
            className="resize-none"
            disabled={isViewer}
          />
        </div>
      </div>
      {!isViewer && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />جارٍ الحفظ…</> : "حفظ المدخلات"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Stage 2 content: بناء الاستراتيجية ───────────────────────────────────────

function Stage2Content({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [brief, setBrief] = useState<WorkflowStrategyBrief | null>(null);
  const [creativeBrief, setCreativeBrief] = useState<WorkflowCreativeBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    wfFetch(`/api/campaign-workflow/strategy-brief?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setBrief(normalizeStrategyBrief(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
    wfFetch(`/api/campaign-workflow/creative-brief?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setCreativeBrief(normalizeCreativeBrief(body as Record<string, unknown>));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    setShowDetail(false);

    const [stratRes, creatRes] = await Promise.all([
      wfFetch("/api/campaign-workflow/strategy-brief", {
        method: "POST",
        body: JSON.stringify({ workspaceId, campaignId }),
      }),
      wfFetch("/api/campaign-workflow/creative-brief", {
        method: "POST",
        body: JSON.stringify({ workspaceId, campaignId }),
      }),
    ]);

    setLoading(false);

    if (stratRes.httpStatus === 503 || stratRes.status === 503) {
      setStatus("unavailable");
      if ((stratRes.body as { draft?: unknown }).draft) {
        setBrief(normalizeStrategyBrief((stratRes.body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (stratRes.ok && stratRes.body && typeof stratRes.body === "object") {
      setBrief(normalizeStrategyBrief(stratRes.body as Record<string, unknown>));
      setStatus("ready");
    } else {
      setStatus("error");
      setErrMsg((stratRes.body as { error?: string }).error ?? "فشل توليد موجز الاستراتيجية.");
      return;
    }
    if (creatRes.ok && creatRes.body && typeof creatRes.body === "object") {
      setCreativeBrief(normalizeCreativeBrief(creatRes.body as Record<string, unknown>));
    }
    onGenerated();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        يحوّل النظام مدخلاتك إلى <strong>موجز استراتيجية</strong> وموجز إبداعي جاهز للمراجعة. احفظ المدخلات أولاً للحصول على أفضل نتيجة.
      </p>
      {status === "unavailable" && <UnavailableBanner message="الذكاء الاصطناعي غير متاح حتى يتم إعداد OPENAI_API_KEY. تظهر المسودة أدناه إن كانت متوفرة." />}
      {status === "error" && errMsg && <ErrorBanner message={errMsg} />}

      {brief && !showDetail ? (
        <CompactResultCard
          summary={[brief.objective, brief.keyMessage].filter(Boolean).join(" — ") || "تم توليد موجز الاستراتيجية."}
          onExpand={() => setShowDetail(true)}
        />
      ) : brief && showDetail ? (
        <div className="space-y-4">
          <DraftBanner />
          <GovernanceBanner />

          <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">موجز الاستراتيجية</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {([
                ["الهدف", brief.objective],
                ["الجمهور المستهدف", brief.targetAudience],
                ["التموضع", brief.positioning],
                ["الرسالة الرئيسية", brief.keyMessage],
                ["اتجاه النداء إلى الإجراء", brief.ctaDirection],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-slate-50/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                  <p>{value || "—"}</p>
                </div>
              ))}
            </div>
            <CollapseCard title="القنوات الموصى بها" icon={Target}>
              <SectionList items={brief.recommendedChannels} />
            </CollapseCard>
            <CollapseCard title="زوايا المحتوى" icon={FileText}>
              <SectionList items={brief.contentAngles} />
            </CollapseCard>
            <CollapseCard title="الأصول المطلوبة" icon={ClipboardList}>
              <SectionList items={brief.requiredAssets} />
            </CollapseCard>
            {brief.missingContextWarnings.length > 0 && (
              <CollapseCard title="تحذيرات السياق الناقص" icon={AlertTriangle}>
                <SectionList items={brief.missingContextWarnings} />
              </CollapseCard>
            )}
            <CollapseCard title="ملاحظات المخاطر والسلامة" icon={AlertTriangle}>
              <SectionList items={brief.risksSafetyNotes} />
            </CollapseCard>
          </div>

          {creativeBrief && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">الموجز الإبداعي</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {([
                  ["الرسالة الأساسية", creativeBrief.coreMessage],
                  ["الجمهور", creativeBrief.audience],
                  ["النبرة", creativeBrief.tone],
                  ["اتجاه النص", creativeBrief.textDirection],
                  ["الاتجاه البصري", creativeBrief.visualDirection],
                  ["اتجاه الفيديو", creativeBrief.videoDirection],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border bg-slate-50/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                    <p>{value || "—"}</p>
                  </div>
                ))}
              </div>
              <CollapseCard title="تكييفات القنوات" icon={Target}>
                <SectionList items={creativeBrief.channelAdaptations} />
              </CollapseCard>
              <CollapseCard title="تذكيرات حقوق الاستخدام" icon={AlertTriangle}>
                <SectionList items={creativeBrief.usageRightsReminders} />
              </CollapseCard>
              <CollapseCard title="العناصر المحظورة" icon={AlertTriangle}>
                <SectionList items={creativeBrief.prohibitedElements} />
              </CollapseCard>
            </div>
          )}

          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowDetail(false)}>
            طيّ التفاصيل
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          ولّد موجز الاستراتيجية للحصول على الهدف والتموضع والرسالة الرئيسية وزوايا المحتوى وملاحظات السلامة.
        </p>
      )}

      {!isViewer && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            {loading
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />جارٍ التوليد…</>
              : brief ? "إعادة توليد الاستراتيجية" : "توليد موجز الاستراتيجية"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Stage 3 content: تجهيز المحتوى ───────────────────────────────────────────

type AITextAssistOutput = {
  hooks: string[];
  adCopyVariants: string[];
  captions: string[];
  ctas: string[];
  improvementNotes: string[];
  missingContextWarnings: string[];
  safetyNotes: string[];
};

function Stage3Content({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [result, setResult] = useState<AITextAssistOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleGenerate = async () => {
    if (isViewer) {
      setStatus("error");
      setErrMsg("وضع العرض فقط: اطلب من محرر توليد اقتراحات الذكاء الاصطناعي.");
      return;
    }
    setLoading(true);
    setErrMsg(null);
    setShowDetail(false);
    const { ok, body } = await wfFetch("/api/strategy/text-assist", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    const typedBody = body as { code?: string; output?: AITextAssistOutput; error?: string };
    if (typedBody.code === "AI_TEXT_UNAVAILABLE") {
      setStatus("unavailable");
      if (typedBody.output) setResult(typedBody.output);
      return;
    }
    if (ok && typedBody.output) {
      setStatus("ready");
      setResult(typedBody.output);
      onGenerated();
    } else {
      setStatus("error");
      setErrMsg(typedBody.error ?? "فشل توليد اقتراحات المحتوى.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        خطافات إعلانية، نسخ، تعليقات، ونداءات إلى الإجراء — مسودات مقترحة جاهزة للمراجعة والتعديل.
      </p>
      {status === "unavailable" && <UnavailableBanner message="اقتراحات الذكاء الاصطناعي النصية غير متاحة حتى يتم إعداد OPENAI_API_KEY." />}
      {status === "error" && errMsg && <ErrorBanner message={errMsg} />}

      {result && !showDetail ? (
        <CompactResultCard
          summary={`${result.hooks.length} خطاف · ${result.adCopyVariants.length} نسخة إعلانية · ${result.ctas.length} نداء إلى الإجراء — مسودة فقط`}
          onExpand={() => setShowDetail(true)}
        />
      ) : result && showDetail ? (
        <div className="space-y-4">
          <DraftBanner />
          <GovernanceBanner />
          <div className="grid gap-4 lg:grid-cols-2">
            {([
              ["الخطافات", result.hooks],
              ["نسخ إعلانية", result.adCopyVariants],
              ["التعليقات", result.captions],
              ["النداءات إلى الإجراء", result.ctas],
              ["ملاحظات التحسين", result.improvementNotes],
              ["السياق الناقص", result.missingContextWarnings],
              ["ملاحظات السلامة", result.safetyNotes],
            ] as [string, string[]][]).map(([label, items]) => (
              <div key={label} className="rounded-lg border p-4">
                <p className="font-medium mb-2 text-sm">{label}</p>
                <SectionList items={items} />
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowDetail(false)}>
            طيّ التفاصيل
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          ولّد اقتراحات المحتوى للحصول على مسودات الخطافات والنسخ الإعلانية والتعليقات والنداءات إلى الإجراء.
        </p>
      )}

      {!isViewer && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            {loading
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />جارٍ التوليد…</>
              : result ? "إعادة توليد المحتوى" : "توليد اقتراحات المحتوى"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Stage 4 content: المواصفات الإبداعية ──────────────────────────────────────

function Stage4Content({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [imgSpec, setImgSpec] = useState<WorkflowImagePromptSpecs | null>(null);
  const [vidSpec, setVidSpec] = useState<WorkflowVideoScriptSpecs | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    wfFetch(`/api/campaign-workflow/image-prompt-specs?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setImgSpec(normalizeImagePromptSpecs(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
    wfFetch(`/api/campaign-workflow/video-script-specs?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setVidSpec(normalizeVideoScriptSpecs(body as Record<string, unknown>));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    setShowDetail(false);

    const [imgRes, vidRes] = await Promise.all([
      wfFetch("/api/campaign-workflow/image-prompt-specs", {
        method: "POST",
        body: JSON.stringify({ workspaceId, campaignId }),
      }),
      wfFetch("/api/campaign-workflow/video-script-specs", {
        method: "POST",
        body: JSON.stringify({ workspaceId, campaignId }),
      }),
    ]);

    setLoading(false);

    if (imgRes.status === 503) {
      setStatus("unavailable");
      if ((imgRes.body as { draft?: unknown }).draft) {
        setImgSpec(normalizeImagePromptSpecs((imgRes.body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (imgRes.ok && imgRes.body && typeof imgRes.body === "object") {
      setImgSpec(normalizeImagePromptSpecs(imgRes.body as Record<string, unknown>));
      setStatus("ready");
    } else {
      setStatus("error");
      setErrMsg((imgRes.body as { error?: string }).error ?? "فشل توليد مواصفات الصورة.");
      return;
    }
    if (vidRes.ok && vidRes.body && typeof vidRes.body === "object") {
      setVidSpec(normalizeVideoScriptSpecs(vidRes.body as Record<string, unknown>));
    }
    onGenerated();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">
          مواصفات نصية للصورة ولوحة مشاهد الفيديو — جاهزة للمراجعة واستخدامها مع فريق التصميم.
        </p>
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Image className="h-3 w-3" /> مواصفات الصورة نصية فقط ولا يتم توليد صور.</span>
          <span className="flex items-center gap-1.5"><Video className="h-3 w-3" /> نص الفيديو ولوحة المشاهد تخطيط نصي فقط ولا يتم توليد فيديو أو رفع ملفات.</span>
        </div>
      </div>
      {status === "unavailable" && <UnavailableBanner message="الذكاء الاصطناعي غير متاح حتى يتم إعداد OPENAI_API_KEY. تظهر المسودة أدناه إن كانت متوفرة." />}
      {status === "error" && errMsg && <ErrorBanner message={errMsg} />}

      {imgSpec && !showDetail ? (
        <CompactResultCard
          summary={`${imgSpec.imagePrompts.length} مطالبة صورة · ${vidSpec ? "نص فيديو مولّد" : "مواصفات الصورة مكتملة"} — مسودة فقط`}
          onExpand={() => setShowDetail(true)}
        />
      ) : imgSpec && showDetail ? (
        <div className="space-y-4">
          <DraftBanner />
          <GovernanceBanner />

          <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">مواصفات الصورة</p>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
              مواصفات الصورة نصية فقط ولا يتم توليد صور.
            </div>
            <CollapseCard title="مطالبات الصورة" icon={Image} defaultOpen>
              <SectionList items={imgSpec.imagePrompts} />
            </CollapseCard>
            <CollapseCard title="ملاحظات التكوين" icon={FileText}>
              <p className="text-sm text-muted-foreground">{imgSpec.compositionNotes || "—"}</p>
            </CollapseCard>
            <CollapseCard title="اتجاه الأسلوب" icon={PenTool}>
              <p className="text-sm text-muted-foreground">{imgSpec.styleDirection || "—"}</p>
            </CollapseCard>
            <CollapseCard title="ملاحظات المنتج / المشهد" icon={Target}>
              <p className="text-sm text-muted-foreground">{imgSpec.productSceneNotes || "—"}</p>
            </CollapseCard>
            <CollapseCard title="ملاحظات تنسيق القنوات" icon={Target}>
              <SectionList items={imgSpec.channelFormatNotes} />
            </CollapseCard>
            <CollapseCard title="تذكيرات حقوق الاستخدام" icon={AlertTriangle}>
              <SectionList items={imgSpec.usageRightsReminders} />
            </CollapseCard>
          </div>

          {vidSpec && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">نص الفيديو ولوحة المشاهد</p>
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
                تخطيط الفيديو نصي فقط ولا يتم توليد فيديو أو رفع ملفات.
              </div>
              <CollapseCard title="مفهوم الفيديو" icon={Video} defaultOpen>
                <p className="text-sm text-muted-foreground">{vidSpec.videoConcept || "—"}</p>
              </CollapseCard>
              <CollapseCard title="النص المختصر" icon={FileText}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{vidSpec.shortScript || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="مخطط لوحة المشاهد" icon={ClipboardList}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{vidSpec.storyboardOutline || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="قائمة المشاهد" icon={Target}>
                <SectionList items={vidSpec.sceneList} />
              </CollapseCard>
              <CollapseCard title="مسودة التعليق الصوتي" icon={FileText}>
                <p className="text-sm text-muted-foreground">{vidSpec.voiceoverDraft || "—"}</p>
              </CollapseCard>
              <CollapseCard title="مسودة العنوان" icon={FileText}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{vidSpec.captionDraft || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="ملاحظات المنصة / نسبة الأبعاد" icon={Target}>
                <SectionList items={vidSpec.platformAspectRatioNotes} />
              </CollapseCard>
            </div>
          )}

          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowDetail(false)}>
            طيّ التفاصيل
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          ولّد المواصفات الإبداعية للحصول على مطالبات الصورة ونص الفيديو ولوحة المشاهد.
        </p>
      )}

      {!isViewer && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            {loading
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />جارٍ التوليد…</>
              : imgSpec ? "إعادة توليد المواصفات" : "توليد المواصفات الإبداعية"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Status types ──────────────────────────────────────────────────────────────

export type WorkflowStepStatus = "not_started" | "saved" | "generated";

export interface WorkflowStatusSummary {
  intake: WorkflowStepStatus;
  strategyBrief: WorkflowStepStatus;
  creativeBrief: WorkflowStepStatus;
  textSuggestions: WorkflowStepStatus;
  imagePromptSpecs: WorkflowStepStatus;
  videoScriptSpecs: WorkflowStepStatus;
}

// ── Main exported component ───────────────────────────────────────────────────

export function CampaignWorkflowTab({
  workspaceId,
  campaignId,
  campaignName,
  isViewer,
  onStatusChange,
}: {
  workspaceId: number;
  campaignId: number;
  campaignName?: string;
  isViewer: boolean;
  onStatusChange?: (status: WorkflowStatusSummary) => void;
}) {
  const [wfStatus, setWfStatus] = useState<WorkflowStatusSummary>({
    intake: "not_started",
    strategyBrief: "not_started",
    creativeBrief: "not_started",
    textSuggestions: "not_started",
    imagePromptSpecs: "not_started",
    videoScriptSpecs: "not_started",
  });

  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>([
    "not_started",
    "not_started",
    "not_started",
    "not_started",
  ]);

  const [activeStage, setActiveStage] = useState(0);

  const updateWfStatus = useCallback((field: keyof WorkflowStatusSummary, value: WorkflowStepStatus) => {
    setWfStatus((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    onStatusChange?.(wfStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wfStatus]);

  const updateStageStatus = (idx: number, s: StageStatus) => {
    setStageStatuses((prev) => {
      const next = [...prev];
      next[idx] = s;
      return next;
    });
  };

  const completedCount = stageStatuses.filter((s) => s === "generated" || s === "saved").length;
  const progressPct = Math.round((completedCount / 4) * 100);

  const nextStageName = (() => {
    const names = ["فهم الحملة", "بناء الاستراتيجية", "تجهيز المحتوى", "المواصفات الإبداعية"];
    const firstIncomplete = stageStatuses.findIndex((s) => s === "not_started");
    return firstIncomplete === -1 ? "اكتملت جميع المراحل" : names[firstIncomplete];
  })();

  const stages: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
  }[] = [
    { title: "فهم الحملة", subtitle: "معلومات النشاط، الهدف، الجمهور، القيود", icon: ClipboardList },
    { title: "بناء الاستراتيجية", subtitle: "موجز الاستراتيجية والموجز الإبداعي", icon: BookOpen },
    { title: "تجهيز المحتوى", subtitle: "خطافات، نسخ إعلانية، تعليقات، نداءات إلى الإجراء", icon: Sparkles },
    { title: "المواصفات الإبداعية", subtitle: "مواصفات الصورة ونص الفيديو ولوحة المشاهد", icon: Layers },
  ];

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Top assistant summary card ── */}
      <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Rocket className="h-5 w-5 text-emerald-600" />
                مساعد إطلاق الحملة
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                حوّل معلومات الحملة إلى استراتيجية، نصوص، ومواصفات إبداعية جاهزة للمراجعة.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                مسودة فقط
              </Badge>
              <span className="text-xs text-muted-foreground">لا يتم الاعتماد أو النشر تلقائياً</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {campaignName && (
            <p className="text-sm font-medium text-slate-700">الحملة: <span className="text-slate-900">{campaignName}</span></p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>التقدم</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-slate-600 shrink-0">
              الخطوة التالية: <span className="font-medium text-emerald-700">{nextStageName}</span>
            </div>
          </div>
          {isViewer && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              وضع العرض فقط — التوليد معطّل.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4 accordion stages ── */}
      <div className="space-y-3">
        <StageCard
          index={0}
          title={stages[0].title}
          subtitle={stages[0].subtitle}
          icon={stages[0].icon}
          stageStatus={stageStatuses[0]}
          isActive={activeStage === 0}
          onActivate={() => setActiveStage(activeStage === 0 ? -1 : 0)}
        >
          <Stage1Content
            workspaceId={workspaceId}
            campaignId={campaignId}
            isViewer={isViewer}
            onSaved={() => {
              updateStageStatus(0, "saved");
              updateWfStatus("intake", "saved");
              setActiveStage(1);
            }}
          />
        </StageCard>

        <StageCard
          index={1}
          title={stages[1].title}
          subtitle={stages[1].subtitle}
          icon={stages[1].icon}
          stageStatus={stageStatuses[1]}
          isActive={activeStage === 1}
          onActivate={() => setActiveStage(activeStage === 1 ? -1 : 1)}
        >
          <Stage2Content
            workspaceId={workspaceId}
            campaignId={campaignId}
            isViewer={isViewer}
            onGenerated={() => {
              updateStageStatus(1, "generated");
              updateWfStatus("strategyBrief", "generated");
              updateWfStatus("creativeBrief", "generated");
              setActiveStage(2);
            }}
          />
        </StageCard>

        <StageCard
          index={2}
          title={stages[2].title}
          subtitle={stages[2].subtitle}
          icon={stages[2].icon}
          stageStatus={stageStatuses[2]}
          isActive={activeStage === 2}
          onActivate={() => setActiveStage(activeStage === 2 ? -1 : 2)}
        >
          <Stage3Content
            workspaceId={workspaceId}
            campaignId={campaignId}
            isViewer={isViewer}
            onGenerated={() => {
              updateStageStatus(2, "generated");
              updateWfStatus("textSuggestions", "generated");
              setActiveStage(3);
            }}
          />
        </StageCard>

        <StageCard
          index={3}
          title={stages[3].title}
          subtitle={stages[3].subtitle}
          icon={stages[3].icon}
          stageStatus={stageStatuses[3]}
          isActive={activeStage === 3}
          onActivate={() => setActiveStage(activeStage === 3 ? -1 : 3)}
        >
          <Stage4Content
            workspaceId={workspaceId}
            campaignId={campaignId}
            isViewer={isViewer}
            onGenerated={() => {
              updateStageStatus(3, "generated");
              updateWfStatus("imagePromptSpecs", "generated");
              updateWfStatus("videoScriptSpecs", "generated");
            }}
          />
        </StageCard>
      </div>
    </div>
  );
}

// ── WorkflowStatusPanel (used in campaign-detail) ─────────────────────────────

export function WorkflowStatusPanel({ status }: { status: WorkflowStatusSummary }) {
  const steps: [string, keyof WorkflowStatusSummary][] = [
    ["فهم الحملة", "intake"],
    ["موجز الاستراتيجية", "strategyBrief"],
    ["الموجز الإبداعي", "creativeBrief"],
    ["اقتراحات المحتوى", "textSuggestions"],
    ["مواصفات الصورة", "imagePromptSpecs"],
    ["نص الفيديو", "videoScriptSpecs"],
  ];

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-sm font-medium">حالة مساعد إطلاق الحملة</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {steps.map(([label, key]) => {
          const s = status[key];
          return (
            <div key={key} className="flex items-center justify-between text-xs rounded-md border bg-background px-3 py-2">
              <span>{label}</span>
              <span
                className={
                  s === "generated"
                    ? "text-emerald-600"
                    : s === "saved"
                      ? "text-blue-600"
                      : "text-muted-foreground"
                }
              >
                {s === "generated" ? "مكتمل" : s === "saved" ? "تم الحفظ" : "لم يبدأ"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkflowSkeletonLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
