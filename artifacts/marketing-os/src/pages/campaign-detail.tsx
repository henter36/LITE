import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useGetCampaign, 
  useListAssets, 
  useApproveCampaign, 
  useListTrackingLinks, 
  getGetCampaignQueryKey,
  getListAssetsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { CheckCircle, Clock, Link as LinkIcon, Target, Users, MapPin, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaign, isLoading: isCampaignLoading } = useGetCampaign(campaignId, { 
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) } 
  });
  
  const { data: assets, isLoading: isAssetsLoading } = useListAssets({ campaignId }, {
    query: { enabled: !!campaignId, queryKey: getListAssetsQueryKey({ campaignId }) }
  });

  const { data: trackingLinks, isLoading: isLinksLoading } = useListTrackingLinks({ campaignId });

  const approveCampaign = useApproveCampaign();

  const handleApprove = () => {
    approveCampaign.mutate({ id: campaignId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
        toast({ title: "Campaign approved successfully" });
      }
    });
  };

  if (isCampaignLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </SidebarLayout>
    );
  }

  if (!campaign) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold">Campaign not found</h2>
          <p className="text-muted-foreground mt-2">The campaign you're looking for doesn't exist or you don't have access.</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="capitalize text-sm">
              {campaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Campaign overview and assets.</p>
        </div>
        
        {campaign.status !== 'approved' && campaign.status !== 'completed' && campaign.status !== 'active' && (
          <Button onClick={handleApprove} disabled={approveCampaign.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {approveCampaign.isPending ? "Approving..." : "Approve Campaign"}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Target className="h-4 w-4" /> Objective
              </p>
              <p className="capitalize font-medium">{campaign.objective}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Users className="h-4 w-4" /> Audience
              </p>
              <p className="font-medium">{campaign.audience}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4" /> Geography
              </p>
              <p className="font-medium">{campaign.geography}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" /> Duration
              </p>
              <p className="font-medium">
                {format(new Date(campaign.startDate), 'MMM d, yyyy')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">Product/Service</p>
              <p>{campaign.productService}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Budget (Advisory)</p>
              <p className="text-xl font-bold">${campaign.budgetSuggestion.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {campaign.channels.map(c => (
                  <Badge key={c} variant="outline" className="capitalize">{c}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Landing URL</p>
              <a href={campaign.landingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate block">
                {campaign.landingUrl}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assets">Generated Assets</TabsTrigger>
          <TabsTrigger value="links">Tracking Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Creative Assets</CardTitle>
              <CardDescription>Content generated for this campaign by the AI Studio.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAssetsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : assets?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No assets generated yet.</p>
                  <Button variant="link" className="mt-2" onClick={() => window.location.href = '/content-studio'}>
                    Go to Content Studio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets?.map(asset => (
                    <div key={asset.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{asset.headline}</h4>
                        <Badge variant={asset.status === 'approved' ? 'default' : asset.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                          {asset.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{asset.shortCaption}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {asset.hashtags.map(tag => (
                          <span key={tag} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <span className="font-medium text-foreground">CTA:</span> {asset.cta}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>UTM Tracking Links</CardTitle>
              <CardDescription>Links generated for measuring campaign performance.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLinksLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : trackingLinks?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No tracking links created yet.</p>
                  <Button variant="link" className="mt-2" onClick={() => window.location.href = '/tracking-links'}>
                    Generate Links
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks?.map(link => (
                    <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">{link.channel}</Badge>
                          <span className="text-xs text-muted-foreground">Source: {link.source} | Medium: {link.medium}</span>
                        </div>
                        <p className="text-sm font-mono bg-muted p-1.5 rounded break-all">{link.generatedTrackingUrl}</p>
                      </div>
                      <Button variant="secondary" size="sm" className="shrink-0" onClick={() => {
                        navigator.clipboard.writeText(link.generatedTrackingUrl);
                        toast({ title: "Copied to clipboard" });
                      }}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}
