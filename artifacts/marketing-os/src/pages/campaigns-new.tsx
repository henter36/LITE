import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useCreateCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "wouter";

const CHANNELS = [
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X (Twitter)" },
  { id: "tiktok", label: "TikTok" },
] as const;

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  objective: z.enum(["awareness", "traffic", "leads", "sales"]),
  productService: z.string().min(1, "Product/Service details required"),
  audience: z.string().min(1, "Audience required"),
  geography: z.string().min(1, "Geography required"),
  budgetSuggestion: z.coerce.number().min(1, "Budget must be greater than 0"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  channels: z.array(z.string()).min(1, "Select at least one channel"),
  landingUrl: z.string().url("Must be a valid URL").min(1, "Landing URL required"),
});

export default function NewCampaign() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createCampaign = useCreateCampaign();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      objective: "traffic",
      productService: "",
      audience: "",
      geography: "",
      budgetSuggestion: 1000,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      channels: ["instagram"],
      landingUrl: "https://",
    },
  });

  const onSubmit = (data: z.infer<typeof campaignSchema>) => {
    createCampaign.mutate(
      { data: { ...data, workspaceId: activeWorkspaceId } },
      {
        onSuccess: (campaign) => {
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey({ workspaceId: activeWorkspaceId }) });
          toast({ title: "Campaign created — next: generate your ads" });
          setLocation(`/campaigns/${campaign.id}`);
        },
      }
    );
  };

  return (
    <SidebarLayout>
      <div>
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">New Campaign</h1>
        <p className="text-muted-foreground mt-2 text-base">Fill in your campaign brief. You can generate ads once the campaign is saved.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Q3 Launch – Fall Collection" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Objective</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="awareness">Brand Awareness</SelectItem>
                          <SelectItem value="traffic">Website Traffic</SelectItem>
                          <SelectItem value="leads">Lead Generation</SelectItem>
                          <SelectItem value="sales">Sales / Conversions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">What are you promoting?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the product or service this campaign is for." className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Who should see this?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your target audience." className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="geography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Locations</FormLabel>
                      <FormControl>
                        <Input placeholder="US, UK, Canada" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetSuggestion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Budget Plan ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="landingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Landing Page URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com/landing" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">End Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="channels"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Channels</FormLabel>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {CHANNELS.map((channel) => (
                        <FormField
                          key={channel.id}
                          control={form.control}
                          name="channels"
                          render={({ field }) => (
                            <FormItem
                              key={channel.id}
                              className="flex flex-row items-center space-x-2.5 space-y-0 rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(channel.id)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([...(field.value || []), channel.id])
                                      : field.onChange(field.value?.filter((v) => v !== channel.id))
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">{channel.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation("/campaigns")}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={createCampaign.isPending} className="min-w-[180px]">
                  {createCampaign.isPending ? "Creating..." : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
