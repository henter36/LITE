import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useListCampaigns, 
  useGenerateAssets, 
  useListAssets, 
  useCreateApproval,
  useListBrandProfiles,
  getListAssetsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, X, Edit3, MessageSquare, BookOpen, ShieldCheck, FlaskConical } from "lucide-react";

function countGuardrails(forbiddenClaims: string): number {
  if (!forbiddenClaims.trim()) return 0;
  return forbiddenClaims
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5).length;
}

export default function ContentStudio() {
  const { activeWorkspaceId } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });
  const { data: brandProfiles } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const brandProfile = brandProfiles?.[0];
  
  const campaignIdNum = selectedCampaignId ? parseInt(selectedCampaignId, 10) : undefined;
  
  const { data: assets, isLoading: isAssetsLoading } = useListAssets(
    { campaignId: campaignIdNum }, 
    { query: { enabled: !!campaignIdNum, queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) } }
  );

  const generateAssets = useGenerateAssets();
  const createApproval = useCreateApproval();

  const selectedCampaign = campaigns?.find(c => c.id === campaignIdNum);
  const guardrailCount = brandProfile ? countGuardrails(brandProfile.forbiddenClaims) : 0;
  const hasGenerated = !!campaignIdNum && !isAssetsLoading && (assets?.length ?? 0) > 0;

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
        decision, 
        actor: "Demo User",
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

      {brandProfile && selectedCampaignId && (
        <Alert className="mb-6 border-blue-500/30 bg-blue-500/5">
          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-foreground">
              Using brand profile: {brandProfile.brandName}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Tone: <span className="text-foreground">{brandProfile.toneOfVoice}</span>
            </span>
            {guardrailCount > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span>
                    <span className="font-medium text-green-700 dark:text-green-400">{guardrailCount} guardrail{guardrailCount !== 1 ? "s" : ""}</span>
                    {" "}applied
                  </span>
                </span>
              </>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              <FlaskConical className="h-3 w-3 shrink-0" />
              Simulated generation
            </span>
          </AlertDescription>
        </Alert>
      )}

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
            <CardDescription>
              Click <strong>Generate Content</strong> to create AI assets for this campaign.
              {brandProfile && (
                <span className="block mt-1 text-xs">
                  Your brand profile <strong>{brandProfile.brandName}</strong> will be used to guide tone and apply guardrails.
                </span>
              )}
            </CardDescription>
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

              {brandProfile && (
                <CardFooter className="border-t bg-muted/10 px-6 py-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    Generated using brand profile
                    <span className="font-medium text-foreground">{brandProfile.brandName}</span>
                    {guardrailCount > 0 && (
                      <>
                        <span>·</span>
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                        <span>{guardrailCount} guardrail{guardrailCount !== 1 ? "s" : ""} active</span>
                      </>
                    )}
                    <span>·</span>
                    <FlaskConical className="h-3 w-3 shrink-0" />
                    <span>Simulated</span>
                  </p>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
