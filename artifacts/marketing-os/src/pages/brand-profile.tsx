import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListBrandProfiles, useCreateBrandProfile, useUpdateBrandProfile, getListBrandProfilesQueryKey } from "@workspace/api-client-react";
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
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const { data: profiles, isLoading } = useListBrandProfiles({ workspaceId: 1 });
  const profile = profiles?.[0]; // Assume 1 profile per workspace for MVP
  
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
        toneOfVoice: profile.toneOfVoice,
        targetAudience: profile.targetAudience,
        productsServices: profile.productsServices,
        forbiddenClaims: profile.forbiddenClaims,
        preferredChannels: profile.preferredChannels,
        visualNotes: profile.visualNotes,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: z.infer<typeof brandProfileSchema>) => {
    if (profile) {
      updateProfile.mutate({ id: profile.id, data: { ...data, workspaceId: 1 } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: 1 }) });
          toast({ title: "Brand profile updated successfully" });
        }
      });
    } else {
      createProfile.mutate({ data: { ...data, workspaceId: 1 } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: 1 }) });
          toast({ title: "Brand profile created successfully" });
        }
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Profile</h1>
          <p className="text-muted-foreground mt-1">Configure your brand guidelines for AI content generation.</p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Brand Guidelines</CardTitle>
            <CardDescription>
              These settings instruct the AI on how to write content for your campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="toneOfVoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone of Voice</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Professional, friendly, slightly humorous..." className="resize-none" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Small business owners, aged 25-45, looking for growth tools..." className="resize-none" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="productsServices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Products & Services Overview</FormLabel>
                      <FormControl>
                        <Textarea placeholder="We sell B2B SaaS for marketing automation..." className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="forbiddenClaims"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forbidden Claims (Things to never say)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Do not guarantee 10x growth, do not mention competitors..." className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredChannels"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Preferred Channels</FormLabel>
                        <CardDescription>Select the platforms where you typically advertise.</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {CHANNELS.map((channel) => (
                          <FormField
                            key={channel.id}
                            control={form.control}
                            name="preferredChannels"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={channel.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(channel.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), channel.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== channel.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {channel.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visualNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visual Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Always use our primary purple #845EF7, prefer high contrast photography..." className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" disabled={createProfile.isPending || updateProfile.isPending}>
                  {createProfile.isPending || updateProfile.isPending ? "Saving..." : "Save Brand Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </SidebarLayout>
  );
}
