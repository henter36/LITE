import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListCampaigns,
  useGenerateAssets,
  useListAssets,
  useCreateApproval,
  useUpdateAssetBrief,
  useListBrandProfiles,
  useGetAssetVariants,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Check,
  Edit3,
  RefreshCw,
  PenTool,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  EyeOff,
  ImageIcon,
  Video,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { Link as WouterLink, useSearch } from "wouter";

function countGuardrails(forbiddenClaims: string): number {
  if (!forbiddenClaims.trim()) return 0;
  return forbiddenClaims
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5).length;
}

const PLATFORM_TABS = [
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
] as const;

type PlatformId = (typeof PLATFORM_TABS)[number]["id"];

function VariantTabPanel({
  assetId,
  videoScript,
  storyboardOutline,
}: {
  assetId: number;
  videoScript?: string | null;
  storyboardOutline?: string | null;
}) {
  const [activeChannel, setActiveChannel] = useState<PlatformId>("instagram");
  const { data: variants, isLoading } = useGetAssetVariants(assetId);
  const variant = variants?.find((v) => v.channel === activeChannel);

  return (
    <div>
      <div className="flex gap-0.5 border-b mb-4 overflow-x-auto">
        {PLATFORM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChannel(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeChannel === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      ) : variant ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Headline
            </p>
            <p className="font-bold leading-snug">{variant.headline}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Caption
            </p>
            <p className="text-sm leading-relaxed">{variant.caption}</p>
          </div>
          {variant.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {variant.hashtags.map((tag) => (
                <span key={tag} className="text-sm text-primary font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">CTA</span>
            <span className="font-medium text-sm">{variant.cta}</span>
          </div>

          {activeChannel === "tiktok" && (videoScript || storyboardOutline) && (
            <div className="border rounded-lg p-4 bg-muted/10 space-y-4 mt-2">
              {videoScript && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Video Script
                  </p>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                    {videoScript}
                  </pre>
                </div>
              )}
              {storyboardOutline && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Storyboard Outline
                  </p>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                    {storyboardOutline}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No variant data found. Try regenerating the ad.
        </p>
      )}
    </div>
  );
}

function CreativeBriefPanel({
  assetId,
  initialImageBrief,
  initialVideoBrief,
  initialAssetReference,
  isViewer,
}: {
  assetId: number;
  initialImageBrief?: string | null;
  initialVideoBrief?: string | null;
  initialAssetReference?: string | null;
  isViewer: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [imageBrief, setImageBrief] = useState(initialImageBrief ?? "");
  const [videoBrief, setVideoBrief] = useState(initialVideoBrief ?? "");
  const [assetReference, setAssetReference] = useState(initialAssetReference ?? "");
  const [saved, setSaved] = useState(false);
  const updateBrief = useUpdateAssetBrief();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hasBriefContent = !!(initialImageBrief || initialVideoBrief || initialAssetReference);

  const handleSave = () => {
    updateBrief.mutate(
      {
        id: assetId,
        data: {
          imageBrief: imageBrief || undefined,
          videoBrief: videoBrief || undefined,
          assetReference: assetReference || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          toast({ title: "Creative brief saved" });
        },
        onError: () => {
          toast({ title: "Failed to save brief", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="border-t pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Creative Brief
          </p>
          {hasBriefContent && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Added
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Attach image/video direction and asset references to guide your creative team.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Image Creative Brief
            </Label>
            <Textarea
              value={imageBrief}
              onChange={(e) => setImageBrief(e.target.value)}
              placeholder="e.g. Bright lifestyle photo of product in use, warm tones, natural light, show the packaging clearly…"
              rows={3}
              className="resize-none text-sm"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Video Creative Brief
            </Label>
            <Textarea
              value={videoBrief}
              onChange={(e) => setVideoBrief(e.target.value)}
              placeholder="e.g. 15-second vertical video, hook in first 2s, show product demo at 8s, end card with CTA overlay…"
              rows={3}
              className="resize-none text-sm"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Asset Reference (URL or notes)
            </Label>
            <Input
              value={assetReference}
              onChange={(e) => setAssetReference(e.target.value)}
              placeholder="e.g. https://drive.google.com/... or 'Use the hero shot from the April shoot'"
              className="text-sm"
              disabled={isViewer}
            />
          </div>

          {!isViewer && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={updateBrief.isPending || saved}
            >
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {updateBrief.isPending ? "Saving…" : "Save Brief"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContentStudio() {
  const { activeWorkspaceId, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isViewer = user?.role === "viewer";

  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const preselectedId = searchParams.get("campaignId") ?? "";

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(preselectedId);
  const [editDialogAssetId, setEditDialogAssetId] = useState<number | null>(null);
  const [editReason, setEditReason] = useState<string>("");

  const { data: campaigns, isLoading: isCampaignsLoading } = useListCampaigns({
    workspaceId: activeWorkspaceId,
  });
  const { data: brandProfiles, isLoading: isBrandLoading } = useListBrandProfiles({
    workspaceId: activeWorkspaceId,
  });
  const brandProfile = brandProfiles?.[0];

  const campaignIdNum = selectedCampaignId ? parseInt(selectedCampaignId, 10) : undefined;

  const { data: assets, isLoading: isAssetsLoading } = useListAssets(
    { campaignId: campaignIdNum },
    { query: { enabled: !!campaignIdNum, queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) } },
  );

  const generateAssets = useGenerateAssets();
  const createApproval = useCreateApproval();

  const selectedCampaign = campaigns?.find((c) => c.id === campaignIdNum);
  const guardrailCount = brandProfile ? countGuardrails(brandProfile.forbiddenClaims) : 0;
  const displayAssets = assets?.slice(0, 3) ?? [];

  const handleGenerate = () => {
    if (!campaignIdNum) return;
    generateAssets.mutate(
      { data: { campaignId: campaignIdNum } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
          toast({ title: "Ads generated", description: "3 variants are ready for your review." });
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const handleDecision = (
    assetId: number,
    decision: "approved" | "rejected" | "changes_requested",
    reason?: string,
  ) => {
    createApproval.mutate(
      {
        data: {
          assetId,
          decision,
          actor: "Demo User",
          reason: reason ?? "",
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({ campaignId: campaignIdNum }) });
          const label =
            decision === "approved"
              ? "Ad approved"
              : decision === "changes_requested"
                ? "Edit request submitted"
                : "Ad rejected";
          toast({ title: label });
        },
        onError: () => {
          toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const handleSubmitEdit = () => {
    if (editDialogAssetId === null) return;
    handleDecision(editDialogAssetId, "changes_requested", editReason.trim() || "Please revise");
    setEditDialogAssetId(null);
    setEditReason("");
  };

  const cameFromCampaign = !!preselectedId;

  return (
    <SidebarLayout>
      {/* Viewer read-only banner */}
      {isViewer && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-2.5 bg-muted/20">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Read-only access.</span>{" "}
            You can review ad content but cannot generate or approve ads. Ask an Admin to make changes.
          </span>
        </div>
      )}

      {cameFromCampaign && selectedCampaign ? (
        <div>
          <WouterLink href={`/campaigns/${selectedCampaign.id}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
              ← Back to {selectedCampaign.name}
            </Button>
          </WouterLink>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-1">
                Generating ad content for
              </p>
              <h1 className="text-4xl font-bold tracking-tight">{selectedCampaign.name}</h1>
              <p className="text-muted-foreground mt-2 text-base capitalize">
                {selectedCampaign.objective} campaign · {selectedCampaign.channels.join(", ")}
              </p>
            </div>
            {!isViewer && (
              <Button
                onClick={handleGenerate}
                disabled={generateAssets.isPending || !brandProfile}
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generateAssets.isPending
                  ? "Generating…"
                  : displayAssets.length > 0
                    ? "Regenerate Ads"
                    : "Generate Ads"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground mt-2 text-base">
            Generate and approve ad copy for your campaigns.
          </p>
        </div>
      )}

      {selectedCampaignId && !isBrandLoading && !brandProfile && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-500">
            No brand profile set up
          </AlertTitle>
          <AlertDescription className="text-amber-700/80 dark:text-amber-400/80">
            Without brand guidelines, generated ads will be generic and may not match your voice.{" "}
            <WouterLink
              href="/settings"
              className="font-semibold underline underline-offset-2 text-amber-800 dark:text-amber-400"
            >
              Set up your Brand Profile in Settings
            </WouterLink>{" "}
            before generating for best results.
          </AlertDescription>
        </Alert>
      )}

      {selectedCampaignId && brandProfile && (
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground border rounded-lg px-4 py-2.5 bg-muted/20 w-fit">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>
            Brand voice:{" "}
            <span className="font-semibold text-foreground">{brandProfile.brandName}</span>
          </span>
          {guardrailCount > 0 && (
            <>
              <span>·</span>
              <span>
                {guardrailCount} guardrail{guardrailCount !== 1 ? "s" : ""} active
              </span>
            </>
          )}
          {brandProfile.toneOfVoice && (
            <>
              <span>·</span>
              <span className="capitalize">Tone: {brandProfile.toneOfVoice}</span>
            </>
          )}
        </div>
      )}

      {!cameFromCampaign && (
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

              {selectedCampaignId && !isViewer && (
                <Button
                  onClick={handleGenerate}
                  disabled={generateAssets.isPending}
                  size="lg"
                  className="shrink-0"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generateAssets.isPending
                    ? "Generating…"
                    : displayAssets.length > 0
                      ? "Regenerate"
                      : "Generate Ads"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              {isViewer ? (
                "No ads have been generated for this campaign yet."
              ) : (
                <>
                  Click <strong>Generate Ads</strong> above to create 3 variants for{" "}
                  <span className="text-foreground font-medium">{selectedCampaign?.name}</span>.
                  {brandProfile && (
                    <span className="block mt-1 text-xs">
                      Brand voice from <strong>{brandProfile.brandName}</strong> will be applied.
                    </span>
                  )}
                </>
              )}
            </p>
            {!isViewer && (
              <Button onClick={handleGenerate} disabled={generateAssets.isPending || !brandProfile}>
                <Sparkles className="mr-2 h-4 w-4" />
                {generateAssets.isPending ? "Generating…" : "Generate Ads"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {displayAssets.length} ad variant{displayAssets.length !== 1 ? "s" : ""} ready for review
            </p>
            {!isViewer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={generateAssets.isPending}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Regenerate all
              </Button>
            )}
          </div>

          <div className="space-y-6">
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

                  {!isViewer && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditDialogAssetId(asset.id);
                          setEditReason("");
                        }}
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
                        Approve This Ad
                      </Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Base ad copy */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Headline
                    </p>
                    <p className="text-xl font-bold leading-snug">{asset.headline}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Caption
                    </p>
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

                  {/* Platform variant tabs */}
                  <div className="border-t pt-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Platform Variations
                    </p>
                    <VariantTabPanel
                      assetId={asset.id}
                      videoScript={asset.videoScript}
                      storyboardOutline={asset.storyboardOutline}
                    />
                  </div>

                  {/* Creative brief section */}
                  <CreativeBriefPanel
                    assetId={asset.id}
                    initialImageBrief={asset.imageBrief}
                    initialVideoBrief={asset.videoBrief}
                    initialAssetReference={asset.assetReference}
                    isViewer={isViewer}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCampaign && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/10">
              <ChevronRight className="h-4 w-4 shrink-0" />
              <span>
                Once you've reviewed all variants, go back to{" "}
                <WouterLink
                  href={`/campaigns/${selectedCampaign.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {selectedCampaign.name}
                </WouterLink>{" "}
                and click <strong>Mark Campaign Ready</strong>, then use the{" "}
                <strong>Publish</strong> tab to go live.
              </span>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={editDialogAssetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogAssetId(null);
            setEditReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe what you'd like changed in this ad. Your notes will be saved with the revision
              request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="e.g. Make the tone more casual, remove the price mention, shorten the headline…"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            The ad will be marked as "edits requested" so you can track its status.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogAssetId(null);
                setEditReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={createApproval.isPending}>
              {createApproval.isPending ? "Submitting…" : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
