import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListCampaigns,
  useGenerateAssets,
  useListAssets,
  useCreateApproval,
  useListBrandProfiles,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, Edit3, RefreshCw, PenTool, ShieldCheck, Link } from "lucide-react";
import { Link as WouterLink } from "wouter";

function countGuardrails(forbiddenClaims: string): number {
  if (!forbiddenClaims.trim()) return 0;
  return forbiddenClaims
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5).length;
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

  const selectedCampaign = campaigns?.find((c) => c.id === campaignIdNum);
  const guardrailCount = brandProfile ? countGuardrails(brandProfile.forbiddenClaims) : 0;

  const handleGenerate = () => {
    if (!campaignIdNum) return;
    generateAssets.mutate(
      { data: { campaignId: campaignIdNum } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
          toast({ title: "Ads generated" });
        },
      }
    );
  };

  const handleDecision = (assetId: number, decision: "approved" | "rejected" | "changes_requested") => {
    createApproval.mutate(
      {
        data: {
          assetId,
          decision,
          actor: "Demo User",
          reason: decision === "changes_requested" ? "Please revise tone" : "",
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
          const label = decision === "approved" ? "Ad approved" : decision === "changes_requested" ? "Revisions requested" : "Ad rejected";
          toast({ title: label });
        },
      }
    );
  };

  const displayAssets = assets?.slice(0, 3) ?? [];

  return (
    <SidebarLayout>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Content</h1>
        <p className="text-muted-foreground mt-2 text-base">Generate and approve ad copy for your campaigns.</p>
      </div>

      {/* Step 1: Pick a campaign */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2">Which campaign are these ads for?</p>
              {isCampaignsLoading ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : (
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger className="h-11 w-full max-w-sm">
                    <SelectValue placeholder="Select a campaign…" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!campaigns?.length && !isCampaignsLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  No campaigns yet.{" "}
                  <WouterLink href="/campaigns/new" className="text-primary hover:underline">
                    Create one first.
                  </WouterLink>
                </p>
              )}
            </div>

            {selectedCampaignId && (
              <div className="flex items-center gap-3 shrink-0">
                {brandProfile && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/30">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{brandProfile.brandName}</span>
                    {guardrailCount > 0 && (
                      <span className="text-xs">· {guardrailCount} guardrail{guardrailCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={generateAssets.isPending}
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generateAssets.isPending ? "Generating…" : displayAssets.length > 0 ? "Regenerate" : "Generate Ads"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Show ads */}
      {!selectedCampaignId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PenTool className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-lg mb-1">Select a campaign above to begin</p>
            <p className="text-muted-foreground text-sm">Then generate 3 ad variants in one click.</p>
          </CardContent>
        </Card>
      ) : isAssetsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : displayAssets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-primary/40 mb-3" />
            <p className="font-semibold text-lg mb-1">Ready to generate ads</p>
            <p className="text-muted-foreground text-sm mb-4">
              Click <strong>Generate Ads</strong> above to create 3 variants for{" "}
              <span className="text-foreground font-medium">{selectedCampaign?.name}</span>.
              {brandProfile && (
                <span className="block mt-1">
                  Brand voice from <strong>{brandProfile.brandName}</strong> will be applied.
                </span>
              )}
            </p>
            <Button onClick={handleGenerate} disabled={generateAssets.isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              {generateAssets.isPending ? "Generating…" : "Generate Ads"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {displayAssets.length} ad variant{displayAssets.length !== 1 ? "s" : ""} for{" "}
              <span className="text-foreground font-medium">{selectedCampaign?.name}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generateAssets.isPending}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate all
            </Button>
          </div>

          <div className="space-y-4">
            {displayAssets.map((asset, idx) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="border-b bg-muted/20 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">Variant {idx + 1}</span>
                    <Badge
                      variant={
                        asset.status === "approved"
                          ? "default"
                          : asset.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {asset.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecision(asset.id, "changes_requested")}
                      disabled={createApproval.isPending}
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Request Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleDecision(asset.id, "approved")}
                      disabled={createApproval.isPending || asset.status === "approved"}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Headline</p>
                    <p className="text-xl font-bold leading-snug">{asset.headline}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Caption</p>
                    <p className="text-sm leading-relaxed">{asset.shortCaption}</p>
                  </div>

                  {asset.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {asset.hashtags.map((tag) => (
                        <span key={tag} className="text-sm text-primary font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">CTA</span>
                    <span className="font-medium text-sm">{asset.cta}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
