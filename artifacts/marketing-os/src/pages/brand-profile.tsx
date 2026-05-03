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
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand</h1>
            <p className="text-muted-foreground mt-1">Manage brand voice, audience, and content guardrails.</p>
          </div>
          <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Manual updates only
          </div>
        </div>

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Profile Completion</p>
                    <p className="text-lg font-semibold">{profile ? "Profile in progress" : "No brand profile yet"}</p>
                    <p className="text-sm text-muted-foreground">Keep this current so drafts stay on-brand.</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Brand Summary</CardTitle>
                  <CardDescription>High-level guidance used across campaign drafts.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                  <div className="rounded-lg border px-3 py-2"><p className="text-muted-foreground text-xs mb-1">Brand name</p><p className="font-medium">{profile?.brandName || "Not set"}</p></div>
                  <div className="rounded-lg border px-3 py-2"><p className="text-muted-foreground text-xs mb-1">Audience</p><p className="font-medium">{profile?.targetAudience || "Not set"}</p></div>
                  <div className="rounded-lg border px-3 py-2 md:col-span-2"><p className="text-muted-foreground text-xs mb-1">Products & services</p><p className="font-medium">{profile?.productsServices || "Not set"}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" />Brand Identity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField control={form.control} name="brandName" render={({ field }) => (
                        <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input placeholder="Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="toneOfVoice" render={({ field }) => (
                          <FormItem><FormLabel>Voice / Tone</FormLabel><FormControl><Textarea rows={4} className="resize-none" placeholder="Professional, friendly, slightly humorous..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="targetAudience" render={({ field }) => (
                          <FormItem><FormLabel>Audience</FormLabel><FormControl><Textarea rows={4} className="resize-none" placeholder="Small business owners, aged 25-45..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="productsServices" render={({ field }) => (
                        <FormItem><FormLabel>Brand Summary</FormLabel><FormControl><Textarea rows={4} className="resize-none" placeholder="We sell B2B SaaS for marketing automation..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="forbiddenClaims" render={({ field }) => (
                          <FormItem><FormLabel>Keywords / Banned Words</FormLabel><FormControl><Textarea rows={4} className="resize-none" placeholder="Do not guarantee 10x growth..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="visualNotes" render={({ field }) => (
                          <FormItem><FormLabel>Language / CTA Style</FormLabel><FormControl><Textarea rows={4} className="resize-none" placeholder="Prefer Arabic-first copy, action-oriented CTAs..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="preferredChannels" render={() => (
                        <FormItem>
                          <div className="space-y-1 mb-2">
                            <FormLabel className="text-base">Audience / Channels / CTA Style</FormLabel>
                            <CardDescription>Select the platforms you typically advertise on.</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {CHANNELS.map((channel) => (
                              <FormField key={channel.id} control={form.control} name="preferredChannels" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border px-4 py-3 hover:bg-muted/40 cursor-pointer">
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
                                  <FormLabel className="font-normal cursor-pointer">{channel.label}</FormLabel>
                                </FormItem>
                              )} />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">Language settings and preview guidance stay draft-only.</div>
                        <Button type="submit" size="lg" disabled={createProfile.isPending || updateProfile.isPending}>
                          {createProfile.isPending || updateProfile.isPending ? "Saving..." : "Save Brand Profile"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Preview / Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border bg-background px-3 py-3">
                    <p className="font-medium mb-1">How this is used</p>
                    <p className="text-muted-foreground">The brand profile shapes AI drafts across campaigns and content.</p>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-3">
                    <p className="font-medium mb-1">Language settings</p>
                    <p className="text-muted-foreground">Use the language and CTA guidance area to keep messaging consistent.</p>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-3">
                    <p className="font-medium mb-1">Unsupported items</p>
                    <p className="text-muted-foreground">Upload, live publishing, and media generation remain disabled.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" />Language Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border px-3 py-2 flex items-center justify-between"><span>Primary language</span><Badge variant="outline">Managed in text fields</Badge></div>
                  <div className="rounded-lg border px-3 py-2 flex items-center justify-between"><span>RTL guidance</span><Badge variant="outline">Supported</Badge></div>
                  <div className="rounded-lg border px-3 py-2 flex items-center justify-between"><span>CTA style</span><Badge variant="outline">Draft-only</Badge></div>
                  <div className="rounded-lg border px-3 py-2 flex items-center justify-between"><span>Keywords / bans</span><Badge variant="outline">Editable</Badge></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Guardrails</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Brand changes affect only future drafts.</p>
                  <p>Save/update behavior remains unchanged.</p>
                  <p>No new unsupported actions were added.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}