import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListBrandProfiles, useCreateBrandProfile, useUpdateBrandProfile, getListBrandProfilesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, Megaphone, Sparkles, ShieldAlert, Users, MessageCircleMore } from "lucide-react";

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

export default function BrandProfile() {
  const { activeWorkspaceId } = useAuth();
  const { data: profiles, isLoading } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const profile = profiles?.[0];
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createProfile = useCreateBrandProfile();
  const updateProfile = useUpdateBrandProfile();

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
          toast({ title: "Brand profile updated successfully" });
        },
      });
      return;
    }
    createProfile.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: activeWorkspaceId }) });
        toast({ title: "Brand profile created successfully" });
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
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
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
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField control={form.control} name="brandName" render={({ field }) => (
                        <FormItem><FormLabel>اسم العلامة</FormLabel><FormControl><Input className="bg-white" placeholder="Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="toneOfVoice" render={({ field }) => (
                          <FormItem><FormLabel>نبرة الصوت</FormLabel><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="Professional, friendly, slightly humorous..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="targetAudience" render={({ field }) => (
                          <FormItem><FormLabel>الفئة / مجال العمل</FormLabel><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="Small business owners, aged 25-45..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="productsServices" render={({ field }) => (
                        <FormItem><FormLabel>وصف مختصر</FormLabel><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="We sell B2B SaaS for marketing automation..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="forbiddenClaims" render={({ field }) => (
                          <FormItem><FormLabel>قيود الادعاءات</FormLabel><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="Do not guarantee 10x growth..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="visualNotes" render={({ field }) => (
                          <FormItem><FormLabel>أسلوب الدعوة لاتخاذ إجراء</FormLabel><FormControl><Textarea rows={4} className="resize-none bg-white" placeholder="Prefer Arabic-first copy, action-oriented CTAs..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="preferredChannels" render={() => (
                        <FormItem>
                          <div className="space-y-1 mb-2">
                            <FormLabel className="text-base">القنوات المفضلة</FormLabel>
                            <CardDescription>اختَر القنوات التي تستخدمها عادةً في الترويج.</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {CHANNELS.map((channel) => (
                              <FormField key={channel.id} control={form.control} name="preferredChannels" render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-2xl border border-emerald-100 bg-white px-4 py-3 hover:bg-emerald-50/30 cursor-pointer">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(channel.id)}
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

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">إعدادات اللغة ومعاينة النص تبقى ضمن المسودة فقط.</div>
                        <Button type="submit" size="lg" disabled={createProfile.isPending || updateProfile.isPending}>
                          {createProfile.isPending || updateProfile.isPending ? "جارٍ الحفظ..." : "حفظ ملف العلامة"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><Users className="h-4 w-4 text-emerald-600" />معاينة صوت العلامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-3 py-3">
                    <p className="font-medium mb-1">كيف يُستخدم هذا؟</p>
                    <p className="text-muted-foreground">يؤثر ملف العلامة في نبرة المسودات واتساق الرسائل عبر الحملات والمحتوى.</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3">
                    <p className="font-medium mb-1">نصائح سريعة</p>
                    <p className="text-muted-foreground">اجعل النبرة والجمهور والقنوات متوافقة قبل حفظ الملف.</p>
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
                  <p>سلوك الحفظ والتحديث يبقى كما هو.</p>
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