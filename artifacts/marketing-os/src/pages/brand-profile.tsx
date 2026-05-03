import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListBrandProfiles, useCreateBrandProfile, useUpdateBrandProfile, getListBrandProfilesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Globe, Megaphone, Sparkles, ShieldAlert, Users, BrainCircuit, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const CHANNELS = [
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X (Twitter)" },
] as const;

const brandProfileSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  toneOfVoice: z.string().min(1, "Tone of voice is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  productsServices: z.string().min(1, "Products/Services are required"),
  forbiddenClaims: z.string().min(1, "Forbidden claims are required"),
  preferredChannels: z.array(z.string()).min(1, "Select at least one channel"),
  visualNotes: z.string().optional(),
});

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

interface BrandStrategyData {
  id: number;
  status: string;
  source: string;
  strategySummary: string;
  positioning: string;
  idealCustomerProfile: string;
  primaryAudience: string;
  secondaryAudience: string;
  keyMessages: string[];
  valueProposition: string;
  contentPillars: string[];
  channelStrategy: string[];
  toneGuidelines: string;
  ctaGuidelines: string;
  forbiddenClaims: string[];
  riskNotes: string[];
  createdAt: string;
  updatedAt: string;
}

function BrandStrategyCard({
  workspaceId,
  hasBrandProfile,
  isViewer,
}: {
  workspaceId: number;
  hasBrandProfile: boolean;
  isViewer: boolean;
}) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<BrandStrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadStrategy = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const { ok, body } = await apiFetch(`/api/brand-strategy?workspaceId=${workspaceId}`);
    if (ok) {
      setStrategy(body as BrandStrategyData);
      setUnavailable(false);
      setError(null);
    } else if (body?.error !== "No current brand strategy found") {
      setError(body?.error ?? "فشل تحميل الاستراتيجية");
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { loadStrategy(); }, [loadStrategy]);

  const handleGenerate = async () => {
    if (isViewer) return;
    setGenerating(true);
    setError(null);
    setUnavailable(false);
    const { ok, status, body } = await apiFetch("/api/brand-strategy/generate", {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    });
    if (ok) {
      setStrategy(body as BrandStrategyData);
      toast({ title: strategy ? "تم تحديث الاستراتيجية" : "تم توليد الاستراتيجية" });
      setExpanded(false);
    } else if (status === 503) {
      setUnavailable(true);
      toast({ title: "الذكاء الاصطناعي غير متاح", description: "يرجى إعداد OPENAI_API_KEY لتفعيل التوليد الفعلي.", variant: "destructive" });
    } else {
      setError(body?.error ?? "فشل التوليد");
    }
    setGenerating(false);
  };

  return (
    <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <BrainCircuit className="h-4 w-4 text-emerald-600" />
            مساعد بناء الاستراتيجية
          </CardTitle>
          {strategy && (
            <Badge
              variant="outline"
              className={`rounded-full px-3 text-xs ${
                strategy.status === "current"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {strategy.status === "current" ? "فعّالة" : "مسودة"}
            </Badge>
          )}
        </div>
        <CardDescription>
          استراتيجية علامة قابلة للإعادة الاستخدام عبر جميع الحملات — مسودة للمراجعة البشرية فقط.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : unavailable ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
            <p className="text-amber-800 text-xs leading-5">
              الذكاء الاصطناعي غير متاح. يرجى إعداد <code className="font-mono">OPENAI_API_KEY</code> لتفعيل التوليد الفعلي.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <p className="text-red-700 text-xs leading-5">{error}</p>
          </div>
        ) : strategy ? (
          <>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">ملخص الاستراتيجية</p>
                <div className="flex items-center gap-1.5">
                  {strategy.source === "real" && (
                    <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5">AI حقيقي</Badge>
                  )}
                  {strategy.source === "mock" && (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-500 text-[10px] px-2 py-0.5">نموذج</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-700">{strategy.strategySummary}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                <p className="text-xs text-slate-500 mb-1">الجمهور الأساسي</p>
                <p className="font-medium text-slate-800 text-xs leading-5">{strategy.primaryAudience || "—"}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                <p className="text-xs text-slate-500 mb-1">عرض القيمة</p>
                <p className="font-medium text-slate-800 text-xs leading-5">{strategy.valueProposition || "—"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل الكاملة"}
            </button>

            {expanded && (
              <div className="space-y-3 pt-1">
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                  <p className="text-xs text-slate-500 mb-1">التموضع</p>
                  <p className="text-xs leading-5 text-slate-700">{strategy.positioning || "—"}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                  <p className="text-xs text-slate-500 mb-2">الرسائل الأساسية</p>
                  <ul className="space-y-1">
                    {strategy.keyMessages.map((msg, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                  <p className="text-xs text-slate-500 mb-2">ركائز المحتوى</p>
                  <div className="flex flex-wrap gap-1.5">
                    {strategy.contentPillars.map((p, i) => (
                      <Badge key={i} variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                  <p className="text-xs text-slate-500 mb-1">إرشادات النبرة</p>
                  <p className="text-xs leading-5 text-slate-700">{strategy.toneGuidelines || "—"}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                  <p className="text-xs text-slate-500 mb-1">إرشادات الدعوة للإجراء</p>
                  <p className="text-xs leading-5 text-slate-700">{strategy.ctaGuidelines || "—"}</p>
                </div>
                {strategy.riskNotes.length > 0 && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-3 py-3">
                    <p className="text-xs text-amber-700 mb-2 font-medium">ملاحظات المخاطر والضوابط</p>
                    <ul className="space-y-1">
                      {strategy.riskNotes.map((n, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 pt-1">
                  آخر تحديث: {new Date(strategy.updatedAt).toLocaleDateString("ar-SA")} —
                  هذه مسودة للمراجعة البشرية فقط. لا يُعتمد عليها للنشر المباشر.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4 text-center">
            <p className="text-slate-500 text-xs leading-6">
              لا توجد استراتيجية علامة بعد.
              {hasBrandProfile
                ? " اضغط على \"توليد الاستراتيجية\" لبدء البناء."
                : " أكمل ملف العلامة أولاً ثم ولّد الاستراتيجية."}
            </p>
          </div>
        )}

        {isViewer ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            أنت مشاهد — لا يمكنك توليد الاستراتيجية أو تحديثها.
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
            disabled={generating || !hasBrandProfile}
            onClick={handleGenerate}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating
              ? "جارٍ التوليد…"
              : strategy
              ? "تحديث الاستراتيجية"
              : "توليد الاستراتيجية"}
          </Button>
        )}

        {!hasBrandProfile && !isViewer && (
          <p className="text-[11px] text-slate-400 text-center">
            يتطلب وجود ملف علامة مكتمل قبل التوليد.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrandProfile() {
  const { activeWorkspaceId, user } = useAuth();
  const { data: profiles, isLoading } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const profile = profiles?.[0];
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createProfile = useCreateBrandProfile();
  const updateProfile = useUpdateBrandProfile();

  const isViewer = user?.role === "viewer";

  const form = useForm<z.infer<typeof brandProfileSchema>>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: "",
      toneOfVoice: "",
      targetAudience: "",
      productsServices: "",
      forbiddenClaims: "",
      preferredChannels: [],
      visualNotes: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        brandName: profile.brandName,
        toneOfVoice: profile.toneOfVoice ?? undefined,
        targetAudience: profile.targetAudience ?? undefined,
        productsServices: profile.productsServices ?? undefined,
        forbiddenClaims: profile.forbiddenClaims ?? undefined,
        preferredChannels: profile.preferredChannels,
        visualNotes: profile.visualNotes ?? undefined,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: z.infer<typeof brandProfileSchema>) => {
    const payload = { ...data, workspaceId: activeWorkspaceId, visualNotes: data.visualNotes || "" };
    if (profile) {
      updateProfile.mutate({ id: profile.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: activeWorkspaceId }) });
          toast({ title: "تم تحديث ملف العلامة التجارية" });
        },
      });
      return;
    }
    createProfile.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: activeWorkspaceId }) });
        toast({ title: "تم إنشاء ملف العلامة التجارية" });
      },
    });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 overflow-x-hidden" dir="rtl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              نظام العلامة
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">العلامة التجارية</h1>
            <p className="max-w-2xl text-base md:text-lg leading-8 text-slate-500">اضبط نبرة العلامة، الجمهور، والضوابط الإبداعية حتى تخرج كل الصيغ متسقة مع الهوية.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-medium text-emerald-700 shadow-sm">
            تحديث يدوي فقط
          </div>
        </div>

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-4">
              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardContent className="flex items-center justify-between gap-5 p-5">
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">اكتمال ملف العلامة التجارية</p>
                    <p className="text-xl font-semibold text-slate-900">{profile ? "الملف قيد التحسين" : "لا يوجد ملف علامة بعد"}</p>
                    <p className="text-sm leading-6 text-slate-500">حافظ على هذه البيانات محدثة حتى تبقى المسودات متسقة مع الهوية.</p>
                    <div className="space-y-2">
                      <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                        <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
                      </div>
                      <p className="text-xs font-medium text-emerald-700">الخطوة التالية: استكمل وصف النبرة والقنوات المفضلة.</p>
                    </div>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-[8px] border-emerald-100 border-t-emerald-500 text-sm font-semibold text-emerald-700 shadow-inner">
                    73%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><Sparkles className="h-4 w-4 text-emerald-600" />ملخص العلامة</CardTitle>
                  <CardDescription>إرشادات عليا تُستخدم عبر المسودات والحملات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-4">
                    <p className="text-xs mb-1 text-emerald-600">اسم العلامة</p>
                    <p className="text-lg font-semibold text-slate-900">{profile?.brandName || "غير محدد"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{profile?.toneOfVoice || "نبرة العلامة ستظهر هنا بعد الحفظ."}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs mb-1 text-slate-500">الفئة / النشاط</p>
                      <p className="font-semibold text-slate-900">{profile?.productsServices || "غير محدد"}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs mb-1 text-slate-500">الجمهور</p>
                      <p className="font-semibold text-slate-900">{profile?.targetAudience || "غير محدد"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.preferredChannels || []).map((channel) => (
                      <Badge key={channel} variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                        {CHANNELS.find((item) => item.id === channel)?.label || channel}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><Megaphone className="h-4 w-4 text-emerald-600" />هوية العلامة</CardTitle>
                  <CardDescription>ثبت اسم العلامة وطبيعة العمل لتبقى كل المسودات متسقة.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                        <FormField control={form.control} name="brandName" render={({ field }) => (
                          <FormItem><FormLabel>اسم العلامة</FormLabel><FormControl><Input className="bg-white" placeholder="Acme Corp" disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="targetAudience" render={({ field }) => (
                          <FormItem><FormLabel>الفئة / مجال العمل</FormLabel><FormControl><Textarea rows={3} className="resize-none bg-white" placeholder="Small business owners, aged 25-45..." disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="productsServices" render={({ field }) => (
                        <FormItem><FormLabel>وصف مختصر</FormLabel><FormControl><Textarea rows={3} className="resize-none bg-white" placeholder="We sell B2B SaaS for marketing automation..." disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <Card className="border-emerald-100 bg-emerald-50/30 shadow-none">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-900">صوت العلامة</CardTitle>
                            <CardDescription className="text-xs">نبرة واضحة، مختصرة، ومناسبة للجمهور.</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <FormField control={form.control} name="toneOfVoice" render={({ field }) => (
                              <FormItem><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="Professional, friendly, slightly humorous..." disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </CardContent>
                        </Card>
                        <Card className="border-emerald-100 bg-white shadow-none">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-900">اللغة والاستخدام</CardTitle>
                            <CardDescription className="text-xs">القيود، أسلوب الدعوة، وإشارات النشر تبقى داخل المسودة.</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-4">
                            <FormField control={form.control} name="forbiddenClaims" render={({ field }) => (
                              <FormItem><FormLabel>قيود الادعاءات</FormLabel><FormControl><Textarea rows={3} className="resize-none bg-white" placeholder="Do not guarantee 10x growth..." disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="visualNotes" render={({ field }) => (
                              <FormItem><FormLabel>أسلوب الدعوة لاتخاذ إجراء</FormLabel><FormControl><Textarea rows={3} className="resize-none bg-white" placeholder="Prefer Arabic-first copy, action-oriented CTAs..." disabled={isViewer} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border-emerald-100 bg-white shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-900">الجمهور والقنوات</CardTitle>
                          <CardDescription className="text-xs">اختر القنوات المستخدمة فعليًا في الترويج.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <FormField control={form.control} name="preferredChannels" render={() => (
                            <FormItem>
                              <div className="flex flex-wrap gap-3">
                                {CHANNELS.map((channel) => (
                                  <FormField key={channel.id} control={form.control} name="preferredChannels" render={({ field }) => (
                                    <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-2xl border border-emerald-100 bg-white px-4 py-3 hover:bg-emerald-50/30 cursor-pointer">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(channel.id)}
                                          disabled={isViewer}
                                          onCheckedChange={(checked) => {
                                            field.onChange(
                                              checked
                                                ? [...(field.value || []), channel.id]
                                                : field.value?.filter((value) => value !== channel.id),
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer text-slate-700">{channel.label}</FormLabel>
                                    </FormItem>
                                  )} />
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">الجمهور</Badge>
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">CTA</Badge>
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">اللغة</Badge>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </CardContent>
                      </Card>

                      {!isViewer && (
                        <div className="flex flex-col gap-3 border-t border-emerald-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs text-muted-foreground">إعدادات اللغة ومعاينة النص تبقى ضمن المسودة فقط.</div>
                          <Button type="submit" size="lg" disabled={createProfile.isPending || updateProfile.isPending}>
                            {createProfile.isPending || updateProfile.isPending ? "جارٍ الحفظ..." : "حفظ ملف العلامة"}
                          </Button>
                        </div>
                      )}
                      {isViewer && (
                        <div className="border-t border-emerald-100 pt-4">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            أنت مشاهد — لا يمكنك تعديل ملف العلامة.
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <BrandStrategyCard
                workspaceId={activeWorkspaceId}
                hasBrandProfile={!!profile}
                isViewer={isViewer}
              />

              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><Users className="h-4 w-4 text-emerald-600" />معاينة صوت العلامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">معاينة</p>
                    <p className="mt-2 text-base leading-7 text-slate-900">أنشئ حملات تسويقية واثقة وواضحة تعكس شخصية {profile?.brandName || "العلامة"} وتخاطب أصحاب الأعمال الصغيرة.</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                    <p className="font-medium mb-1">كيف يُستخدم هذا؟</p>
                    <p className="text-muted-foreground">تُغذّي الاستراتيجية حملاتك تلقائيًا — لن تحتاج لإعادة بناء الاستراتيجية في كل حملة.</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                    <p className="font-medium mb-1">نصائح لتحسين الملف</p>
                    <p className="text-muted-foreground">اجعل النبرة والجمهور والقنوات متوافقة قبل حفظ الملف وتوليد الاستراتيجية.</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                    <p className="font-medium mb-1">ضوابط الاستخدام</p>
                    <p className="text-muted-foreground">الرفع، توليد الوسائط، والنشر المباشر تبقى غير مفعلة.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><Globe className="h-4 w-4 text-emerald-600" />إعدادات اللغة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100 px-3 py-2 flex items-center justify-between"><span>اللغة الأساسية</span><Badge variant="outline" className="rounded-full">ضمن الحقول النصية</Badge></div>
                  <div className="rounded-2xl border border-emerald-100 px-3 py-2 flex items-center justify-between"><span>إرشاد RTL</span><Badge variant="outline" className="rounded-full">مدعوم</Badge></div>
                  <div className="rounded-2xl border border-emerald-100 px-3 py-2 flex items-center justify-between"><span>أسلوب CTA</span><Badge variant="outline" className="rounded-full">مسودة فقط</Badge></div>
                  <div className="rounded-2xl border border-emerald-100 px-3 py-2 flex items-center justify-between"><span>الكلمات المفتاحية / الحظر</span><Badge variant="outline" className="rounded-full">قابل للتعديل</Badge></div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><ShieldAlert className="h-4 w-4 text-emerald-600" />الضوابط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>تؤثر تغييرات العلامة على المسودات القادمة فقط.</p>
                  <p>الاستراتيجية مسودة للمراجعة البشرية — لا يُعتمد عليها للنشر.</p>
                  <p>لم تُضف أي وظائف غير مدعومة.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
