import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useListCampaigns, 
  useListTrackingLinks, 
  useCreateTrackingLink,
  useDeleteTrackingLink,
  getListTrackingLinksQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const linkSchema = z.object({
  campaignId: z.coerce.number().min(1, "Campaign is required"),
  channel: z.string().min(1, "Channel is required"),
  source: z.string().min(1, "Source is required"),
  medium: z.string().min(1, "Medium is required"),
  campaign: z.string().min(1, "UTM Campaign is required"),
  content: z.string().optional(),
  finalUrl: z.string().url("Must be a valid URL"),
});

export default function TrackingLinks() {
  const { activeWorkspaceId } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns } = useListCampaigns({ workspaceId: activeWorkspaceId });
  
  const campaignFilter = selectedCampaignId !== "all" ? parseInt(selectedCampaignId, 10) : undefined;
  
  const { data: links, isLoading: isLinksLoading } = useListTrackingLinks(
    campaignFilter ? { campaignId: campaignFilter } : {},
    { query: { enabled: true, queryKey: getListTrackingLinksQueryKey(campaignFilter ? { campaignId: campaignFilter } : {}) } }
  );

  const createLink = useCreateTrackingLink();
  const deleteLink = useDeleteTrackingLink();

  const form = useForm<z.infer<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      campaignId: 0,
      channel: "",
      source: "",
      medium: "",
      campaign: "",
      content: "",
      finalUrl: "https://",
    },
  });

  const onSubmit = (data: z.infer<typeof linkSchema>) => {
    createLink.mutate({ data: { ...data, content: data.content || "" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTrackingLinksQueryKey() });
        form.reset({
          ...form.getValues(),
          content: "", // Keep main settings, clear specific content
        });
        toast({ title: "Tracking link generated" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteLink.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTrackingLinksQueryKey() });
        toast({ title: "Link deleted" });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Pre-fill fields when campaign/channel change
  const watchCampaignId = form.watch("campaignId");
  const watchChannel = form.watch("channel");
  
  return (
    <SidebarLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UTM Tracking Links</h1>
          <p className="text-muted-foreground mt-1">Generate and manage trackable URLs for your campaigns.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Generate Link
            </CardTitle>
            <CardDescription>Create a new UTM tagged URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          const camp = campaigns?.find(c => c.id === parseInt(val, 10));
                          if (camp) form.setValue("campaign", camp.name.toLowerCase().replace(/\s+/g, '-'));
                        }} 
                        defaultValue={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaigns?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("source", val);
                            form.setValue("medium", "social");
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="snapchat">Snapchat</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="x">X (Twitter)</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>utm_source</FormLabel>
                        <FormControl>
                          <Input placeholder="instagram" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>utm_medium</FormLabel>
                        <FormControl>
                          <Input placeholder="social" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="campaign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>utm_campaign</FormLabel>
                        <FormControl>
                          <Input placeholder="q3-launch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>utm_content (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="hero-image-v1" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="finalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createLink.isPending}>
                  {createLink.isPending ? "Generating..." : "Generate Link"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Existing Links</CardTitle>
              <CardDescription>All generated tracking links</CardDescription>
            </div>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLinksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : links?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                No tracking links found. Generate one to see it here.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>UTMs</TableHead>
                      <TableHead className="w-[300px]">Generated URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links?.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{link.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-semibold text-muted-foreground">S:</span> {link.source}</div>
                            <div><span className="font-semibold text-muted-foreground">M:</span> {link.medium}</div>
                            <div><span className="font-semibold text-muted-foreground">C:</span> {link.campaign}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs bg-muted p-2 rounded truncate max-w-[250px]" title={link.generatedTrackingUrl}>
                            {link.generatedTrackingUrl}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(link.generatedTrackingUrl)} title="Copy">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.open(link.generatedTrackingUrl, '_blank')} title="Test Link">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(link.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
