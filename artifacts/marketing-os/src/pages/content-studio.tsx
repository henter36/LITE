import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useListCampaigns, 
  useGenerateAssets, 
  useListAssets, 
  useCreateApproval,
  getListAssetsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, X, Edit3, MessageSquare } from "lucide-react";

export default function ContentStudio() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({ workspaceId: 1 });
  
  const campaignIdNum = selectedCampaignId ? parseInt(selectedCampaignId, 10) : undefined;
  
  const { data: assets, isLoading: isAssetsLoading } = useListAssets(
    { campaignId: campaignIdNum }, 
    { query: { enabled: !!campaignIdNum, queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) } }
  );

  const generateAssets = useGenerateAssets();
  const createApproval = useCreateApproval();

  const handleGenerate = () => {
    if (!campaignIdNum) return;
    generateAssets.mutate({ data: { campaignId: campaignIdNum } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
        toast({ title: "Content generation started", description: "This will take a few moments." });
      }
    });
  };

  const handleDecision = (assetId: number, decision: "approved" | "rejected" | "changes_requested") => {
    createApproval.mutate({ 
      data: { 
        assetId, 
        actor: "Current User", // Mock user
        decision, 
        reason: decision === "changes_requested" ? "Please revise tone" : "" 
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
        toast({ title: `Asset ${decision}` });
      }
    });
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
          <p className="text-muted-foreground mt-1">AI-powered marketing copy and asset generation.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns?.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedCampaignId || generateAssets.isPending}
            className="shrink-0"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generateAssets.isPending ? "Generating..." : "Generate Content"}
          </Button>
        </div>
      </div>

      {!selectedCampaignId ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardHeader className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <CardTitle className="text-xl">Select a campaign to begin</CardTitle>
            <CardDescription>Choose a campaign from the dropdown above to view or generate content.</CardDescription>
          </CardHeader>
        </Card>
      ) : isAssetsLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ) : assets?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardHeader className="text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 opacity-80" />
            <CardTitle className="text-xl">Ready to generate content</CardTitle>
            <CardDescription>Click the Generate Content button to create AI assets for this campaign.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-8">
          {assets?.map(asset => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                <Badge variant={
                  asset.status === 'approved' ? 'default' : 
                  asset.status === 'rejected' ? 'destructive' : 
                  'secondary'
                } className="capitalize">
                  {asset.status}
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDecision(asset.id, "rejected")}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecision(asset.id, "changes_requested")}>
                    <Edit3 className="h-4 w-4 mr-1" /> Revise
                  </Button>
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision(asset.id, "approved")}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-6 md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Headline</h3>
                      <p className="text-xl font-bold">{asset.headline}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Short Copy</h3>
                      <p className="text-base">{asset.shortCaption}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Long Copy</h3>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{asset.longCaption}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {asset.hashtags.map(tag => (
                        <span key={tag} className="text-sm text-primary font-medium">#{tag}</span>
                      ))}
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Call to Action</h3>
                      <p className="font-medium">{asset.cta}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-muted/10 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Video Script</h3>
                      <div className="text-sm whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded text-muted-foreground">
                        {asset.videoScript || "No script generated."}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Storyboard</h3>
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {asset.storyboardOutline || "No storyboard generated."}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
