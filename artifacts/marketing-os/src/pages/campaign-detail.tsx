import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetCampaign,
  useListAssets,
  useApproveCampaign,
  useManualPublishCampaign,
  useListTrackingLinks,
  useListMetrics,
  useCreateTrackingLink,
  getGetCampaignQueryKey,
  getListAssetsQueryKey,
  getListMetricsQueryKey,
  getListTrackingLinksQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { differenceInDays, parseISO, min as dateMin, format } from "date-fns";
import {
  CheckCircle,
  Link as LinkIcon,
  Target,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  FlaskConical,
  ArrowLeft,
  Megaphone,
  PenTool,
  BarChart3,
  Check,
  Plus,
  Info,
  ArrowRight,
  Sparkles,
  EyeOff,
  Rocket,
  Send,
  ClipboardCheck,
  Image,
  Video,
  FileText,
  File,
  ExternalLink,
  Library,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── Creative Assets section (campaign-linked media assets) ─────────────────

type AssetType = "image" | "video" | "document" | "link" | "other";
type SourceType = "uploaded" | "external_url" | "generated_later";
type AssetStatus = "draft" | "needs_review" | "approved" | "rejected";

interface MediaAsset {
  id: number;
  workspaceId: number;
  campaignId: number | null;
  title: string;
  type: AssetType;
  sourceType: SourceType;
  urlOrReference: string;
  description: string;
  channel: string | null;
  status: AssetStatus;
  usageRightsNotes: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  image: Image,
  video: Video,
  document: FileText,
  link: Link as React.ElementType,
  other: File,
};

const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  needs_review: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
};

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

async function mediaAssetFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function CampaignCreativeAssets({
  campaignId,
  isViewer,
}: {
  campaignId: number;
  isViewer: boolean;
}) {
  const { toast } = useToast();
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  if (!mediaLoaded) {
    setMediaLoaded(true);
    setMediaLoading(true);
    mediaAssetFetch(`/api/media-assets?campaignId=${campaignId}`)
      .then((data: MediaAsset[]) => setMediaAssets(data ?? []))
      .catch(() => setMediaAssets([]))
      .finally(() => setMediaLoading(false));
  }

  const handleStatusChange = async (asset: MediaAsset, newStatus: AssetStatus) => {
    if (newStatus === "approved" && !asset.usageRightsNotes.trim()) {
      toast({
        title: "Usage rights notes required",
        description: "Edit this asset in the Asset Library to add usage rights notes before approving.",
        variant: "destructive",
      });
      return;
    }
    try {
      const updated: MediaAsset = await mediaAssetFetch(`/api/media-assets/${asset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setMediaAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));
      toast({ title: `Asset ${newStatus}` });
    } catch (e) {
      toast({
        title: "Failed to update status",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Creative Assets
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Asset references linked to this campaign.
            </p>
          </div>
          <Link href="/asset-library">
            <Button size="sm" variant="outline">
              <Library className="mr-2 h-3.5 w-3.5" />
              Manage in Asset Library
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {mediaLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : mediaAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
            <Library className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-medium mb-1">No creative assets linked</p>
            <p className="text-muted-foreground text-sm mb-4">
              {isViewer
                ? "No creative assets have been linked to this campaign."
                : "Add and link assets from the Asset Library, then attach them to this campaign."}
            </p>
            {!isViewer && (
              <Link href="/asset-library">
                <Button variant="outline" size="sm">
                  <Library className="mr-2 h-4 w-4" />
                  Go to Asset Library
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mediaAssets.map((asset) => {
              const TypeIcon = ASSET_TYPE_ICONS[asset.type] ?? File;
              return (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm leading-tight">{asset.title}</p>
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${ASSET_STATUS_COLORS[asset.status]}`}
                        >
                          {asset.status.replace("_", " ")}
                        </Badge>
                        {!isViewer && asset.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs text-green-700 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleStatusChange(asset, "approved")}
                          >
                            Approve
                          </Button>
                        )}
                        {!isViewer && asset.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleStatusChange(asset, "needs_review")}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                    {asset.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {asset.description}
                      </p>
                    )}
                    <a
                      href={asset.urlOrReference.startsWith("http") ? asset.urlOrReference : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline mt-1 max-w-xs truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{asset.urlOrReference}</span>
                    </a>
                    {asset.usageRightsNotes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rights: {asset.usageRightsNotes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── End Creative Assets section ────────────────────────────────────────────

function computeBudgetPacing(budgetSuggestion: number, startDate: string, endDate: string) {
  const today = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const cappedToday = dateMin([today, end]);

  const totalDays = Math.max(differenceInDays(end, start), 1);
  const daysElapsed = Math.max(differenceInDays(cappedToday, start), 0);
  const progressPct = Math.min(daysElapsed / totalDays, 1);

  const expectedSpend = budgetSuggestion * progressPct;
  const simulatedSpend = expectedSpend * 0.92;
  const variancePct =
    expectedSpend > 0 ? ((simulatedSpend - expectedSpend) / expectedSpend) * 100 : 0;

  let verdict: "On Pace" | "Underspending" | "Overspending";
  if (variancePct < -15) verdict = "Underspending";
  else if (variancePct > 15) verdict = "Overspending";
  else verdict = "On Pace";

  const daysRemaining = Math.max(differenceInDays(end, today), 0);

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    progressPct,
    expectedSpend,
    simulatedSpend,
    variancePct,
    verdict,
  };
}

const LINK_CHANNELS = ["instagram", "snapchat", "youtube", "x", "tiktok", "email", "other"];
const PUBLISH_CHANNELS = ["instagram", "snapchat", "youtube", "x", "tiktok"];

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const isViewer = user?.role === "viewer";

  // Tracking link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkChannel, setLinkChannel] = useState("instagram");
  const [linkSource, setLinkSource] = useState("instagram");
  const [linkMedium, setLinkMedium] = useState("paid");
  const [linkCampaignName, setLinkCampaignName] = useState("");
  const [linkContent, setLinkContent] = useState("");
  const [linkFinalUrl, setLinkFinalUrl] = useState("");

  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishChannels, setPublishChannels] = useState<string[]>([]);
  const [publishNotes, setPublishNotes] = useState("");

  const { data: campaign, isLoading: isCampaignLoading } = useGetCampaign(campaignId, {
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) },
  });

  const { data: assets, isLoading: isAssetsLoading } = useListAssets(
    { campaignId },
    { query: { enabled: !!campaignId, queryKey: getListAssetsQueryKey({ campaignId }) } },
  );

  const { data: trackingLinks } = useListTrackingLinks({ campaignId });
  const approveCampaign = useApproveCampaign();
  const manualPublishCampaign = useManualPublishCampaign();
  const createTrackingLink = useCreateTrackingLink();

  const { data: metrics } = useListMetrics(
    { campaignId },
    {
      query: {
        enabled: !!campaignId,
        queryKey: getListMetricsQueryKey({ campaignId }),
      },
    },
  );
  const hasMetrics = (metrics?.length ?? 0) > 0;

  const handleApprove = () => {
    approveCampaign.mutate(
      { id: campaignId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
          toast({ title: "Campaign marked as ready" });
        },
      },
    );
  };

  const openPublishDialog = () => {
    setPublishChannels((campaign?.channels as string[]) ?? []);
    setPublishNotes("");
    setPublishDialogOpen(true);
  };

  const handleManualPublish = () => {
    if (publishChannels.length === 0) {
      toast({ title: "Select at least one channel", variant: "destructive" });
      return;
    }
    manualPublishCampaign.mutate(
      { id: campaignId, data: { channels: publishChannels, notes: publishNotes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
          setPublishDialogOpen(false);
          toast({
            title: "Campaign published",
            description: `Marked as live on ${publishChannels.join(", ")}.`,
          });
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Please try again.";
          toast({ title: "Publish failed", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const togglePublishChannel = (ch: string) => {
    setPublishChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const openLinkDialog = () => {
    setLinkChannel("instagram");
    setLinkSource("instagram");
    setLinkMedium("paid");
    setLinkCampaignName(campaign?.name ?? "");
    setLinkContent("");
    setLinkFinalUrl(campaign?.landingUrl ?? "");
    setLinkDialogOpen(true);
  };

  const handleCreateLink = () => {
    if (!linkChannel || !linkSource || !linkMedium || !linkCampaignName || !linkFinalUrl) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createTrackingLink.mutate(
      {
        data: {
          campaignId,
          channel: linkChannel,
          source: linkSource,
          medium: linkMedium,
          campaign: linkCampaignName,
          content: linkContent,
          finalUrl: linkFinalUrl,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListTrackingLinksQueryKey({ campaignId }),
          });
          setLinkDialogOpen(false);
          toast({ title: "Tracking link created", description: "Ready to copy and use." });
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Please check the URL and try again.";
          toast({ title: "Failed to create link", description: msg, variant: "destructive" });
        },
      },
    );
  };

  if (isCampaignLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </SidebarLayout>
    );
  }

  if (!campaign) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <h2 className="text-2xl font-bold">Campaign not found</h2>
          <p className="text-muted-foreground mt-2">
            This campaign doesn't exist or you don't have access.
          </p>
          <Link href="/campaigns">
            <Button className="mt-4">Back to Campaigns</Button>
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const pacing = computeBudgetPacing(
    campaign.budgetSuggestion ?? 0,
    campaign.startDate ?? "",
    campaign.endDate ?? "",
  );

  const verdictColor =
    pacing.verdict === "On Pace"
      ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400"
      : pacing.verdict === "Overspending"
        ? "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400"
        : "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";

  const VerdictIcon =
    pacing.verdict === "On Pace"
      ? Minus
      : pacing.verdict === "Overspending"
        ? TrendingUp
        : TrendingDown;

  const hasAssets = !isAssetsLoading && (assets?.length ?? 0) > 0;
  const approvedAdCount = assets?.filter((a) => a.status === "approved").length ?? 0;
  const hasApprovedAd = approvedAdCount > 0;
  const isApproved = campaign.status === "approved" || campaign.status === "active";
  const isPublished = campaign.status === "active" && !!campaign.publishedAt;
  const approvedCreativeAssetCount = 0;
  const hasApprovedCreativeAsset = approvedCreativeAssetCount > 0;
  const hasUsageRightsNotes = hasApprovedCreativeAsset;
  const hasTrackingLink = (trackingLinks?.length ?? 0) > 0;
  const hasSelectedChannels = (campaign.channels?.length ?? 0) > 0;
  const strategySummary =
    campaign.objective && campaign.audience && campaign.productService
      ? `${campaign.objective} • ${campaign.audience} • ${campaign.productService}`
      : "";
  const hasStrategyContext = Boolean(strategySummary);
  const readinessRequirements = [
    { label: "Strategy context", ok: hasStrategyContext },
    { label: "Approved ads", ok: hasApprovedAd },
    { label: "Campaign marked ready", ok: isApproved },
    { label: "Approved creative asset/reference", ok: hasApprovedCreativeAsset && hasUsageRightsNotes },
    { label: "Tracking link or landing URL", ok: hasTrackingLink || Boolean(campaign.landingUrl) },
    { label: "Selected channels", ok: hasSelectedChannels },
  ];
  const readinessScore = Math.round(
    (readinessRequirements.filter((item) => item.ok).length / readinessRequirements.length) * 100,
  );

  // 5-step flow: Create (0) → Generate Ads (1) → Approve (2) → Publish (3) → Performance (4)
  const completedSteps = [true, hasAssets, isApproved, isPublished, hasMetrics];
  const currentStep = completedSteps.findIndex((done) => !done);
  const effectiveStep = currentStep === -1 ? 5 : currentStep;

  const FLOW_STEPS = [
    { label: "Create Campaign", icon: Megaphone, href: null, nextAction: null },
    {
      label: "Generate Ads",
      icon: PenTool,
      href: `/content-studio?campaignId=${campaignId}`,
      nextAction: "Generate your ad content →",
    },
    {
      label: "Approve",
      icon: CheckCircle,
      href: null,
      nextAction: "Review ads, then click 'Mark Campaign Ready' above",
    },
    {
      label: "Publish",
      icon: Send,
      href: null,
      nextAction: "Campaign is approved — open the Publish tab to go live",
    },
    {
      label: "Performance",
      icon: BarChart3,
      href: `/reports`,
      nextAction: "View demo performance data →",
    },
  ];

  const activeStep = effectiveStep < FLOW_STEPS.length ? FLOW_STEPS[effectiveStep] : null;
  const manualPublishReady =
    hasApprovedAd &&
    isApproved &&
    hasApprovedCreativeAsset &&
    hasUsageRightsNotes &&
    (hasTrackingLink || Boolean(campaign.landingUrl)) &&
    hasSelectedChannels;

  return (
    <SidebarLayout>
      {/* Viewer read-only banner */}
      {isViewer && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-2.5 bg-muted/20">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Read-only access.</span>{" "}
            You can view campaign details but cannot make changes. Ask an Admin to take action.
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Campaign Completion
            </CardTitle>
            <Badge variant="outline" className={manualPublishReady ? "bg-green-500/10 text-green-700" : ""}>
              {manualPublishReady ? "Ready for manual publish" : "Not ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategySummary && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Strategy summary:</span> {strategySummary}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Strategy summary status</p>
              <p className="font-medium">{hasStrategyContext ? "Present" : "Missing"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Content approval status</p>
              <p className="font-medium">{hasApprovedAd ? "Approved ads available" : "No approved ads yet"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Creative asset approval status</p>
              <p className="font-medium">
                {hasApprovedCreativeAsset ? `${approvedCreativeAssetCount} approved` : "Missing approved asset/reference"}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Tracking link status</p>
              <p className="font-medium">{hasTrackingLink || campaign.landingUrl ? "Available" : "Missing"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Campaign ready status</p>
              <p className="font-medium">{isApproved ? "Ready" : "Not ready"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Manual publish status</p>
              <p className="font-medium">{manualPublishReady ? "Allowed" : "Blocked"}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Readiness score</p>
              <Badge variant="outline">{readinessScore}%</Badge>
            </div>
            <Progress value={readinessScore} className="h-2" />
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {readinessRequirements.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                >
                  <span>{item.label}</span>
                  <span className={item.ok ? "text-green-600" : "text-red-600"}>
                    {item.ok ? "Complete" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/strategy">
              <Button variant="outline" size="sm">
                Strategy page
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="outline" size="sm">
                Creative Assets tab
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div>
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge
                variant={
                  campaign.status === "active" || campaign.status === "approved"
                    ? "default"
                    : "secondary"
                }
                className="capitalize"
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-base capitalize">
              {campaign.objective} campaign
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isViewer && !isApproved && (
              <div className="flex flex-col items-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleApprove} disabled={approveCampaign.isPending}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {approveCampaign.isPending ? "Saving…" : "Mark Campaign Ready"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px] text-center">
                    Confirms the whole campaign is reviewed and ready to run. Different from approving
                    individual ads in the Content page.
                  </TooltipContent>
                </Tooltip>
                <p className="text-xs text-muted-foreground text-right">
                  Approve ads, creative assets, tracking, and channels before manual publish
                </p>
              </div>
            )}
            {isApproved && !isPublished && !isViewer && (
              <Button
                onClick={openPublishDialog}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!manualPublishReady}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Publish Campaign
              </Button>
            )}
            {isPublished && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-700 border-green-500/20 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Published
              </Badge>
            )}
            {isApproved && !isPublished && (
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Campaign Ready
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Clickable flow indicator */}
      <div className="space-y-3">
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {FLOW_STEPS.map((step, i) => {
            const done = i < effectiveStep;
            const active = i === effectiveStep;
            const Icon = step.icon;

            const pill = (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${done ? "bg-primary/10 text-primary" : ""}
                  ${active && step.href ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90" : ""}
                  ${active && !step.href ? "bg-primary text-primary-foreground" : ""}
                  ${!done && !active ? "bg-muted text-muted-foreground" : ""}`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {step.label}
                {active && step.href && <ArrowRight className="h-3 w-3 ml-0.5" />}
              </div>
            );

            return (
              <div key={step.label} className="flex items-center">
                {active && step.href ? <Link href={step.href}>{pill}</Link> : pill}
                {i < FLOW_STEPS.length - 1 && (
                  <div className="w-6 h-px bg-border mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {effectiveStep < FLOW_STEPS.length && activeStep?.nextAction && (
          <div className="flex items-center gap-2 text-sm">
            {activeStep.href ? (
              <Link
                href={activeStep.href}
                className="flex items-center gap-1.5 text-primary font-medium hover:underline"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {activeStep.nextAction}
              </Link>
            ) : (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {activeStep.nextAction}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Details + Budget */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Campaign Brief</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Target className="h-3.5 w-3.5" /> Objective
              </p>
              <p className="capitalize font-medium">{campaign.objective}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5" /> Audience
              </p>
              <p className="font-medium">{campaign.audience}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </p>
              <p className="font-medium">{campaign.geography}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5" /> Duration
              </p>
              <p className="font-medium">
                {campaign.startDate ? format(parseISO(campaign.startDate), "MMM d") : "—"} –{" "}
                {campaign.endDate ? format(parseISO(campaign.endDate), "MMM d, yyyy") : "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">What's being promoted</p>
              <p>{campaign.productService}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {campaign.channels.map((c) => (
                  <Badge key={c} variant="outline" className="capitalize">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Budget Pacing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Budget Plan</p>
              <p className="text-2xl font-bold">${(campaign.budgetSuggestion ?? 0).toLocaleString()}</p>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pacing</p>
                <Badge variant="outline" className={`text-xs font-medium ${verdictColor}`}>
                  <VerdictIcon className="h-3 w-3 mr-1" />
                  {pacing.verdict}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Day {pacing.daysElapsed} of {pacing.totalDays}
                  </span>
                  <span>{pacing.daysRemaining}d left</span>
                </div>
                <Progress value={pacing.progressPct * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background rounded p-2 border">
                  <p className="text-muted-foreground mb-0.5">Demo Spend</p>
                  <p className="font-semibold text-sm">
                    ${pacing.simulatedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-background rounded p-2 border">
                  <p className="text-muted-foreground mb-0.5">Expected</p>
                  <p className="font-semibold text-sm">
                    ${pacing.expectedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FlaskConical className="h-3 w-3 shrink-0" />
                Simulated pacing — demo data only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Ad Content</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
          <TabsTrigger value="links">Tracking Links</TabsTrigger>
          <TabsTrigger value="creative-assets">Creative Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Ad Content</CardTitle>
                  {hasAssets && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {approvedAdCount} of {assets?.length ?? 0} ad
                      {(assets?.length ?? 0) !== 1 ? "s" : ""} approved
                    </p>
                  )}
                </div>
                {!isViewer && (!assets || assets.length === 0) && (
                  <Link href={`/content-studio?campaignId=${campaignId}`}>
                    <Button size="sm">
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Generate Ads
                    </Button>
                  </Link>
                )}
                {assets && assets.length > 0 && (
                  <Link href={`/content-studio?campaignId=${campaignId}`}>
                    <Button size="sm" variant="outline">
                      <PenTool className="mr-2 h-3.5 w-3.5" />
                      {isViewer ? "View in Content Page" : "Review in Content Page"}
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isAssetsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : !assets || assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                  <PenTool className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-medium mb-1">No ads generated yet</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    {isViewer
                      ? "No ad content has been generated for this campaign."
                      : `Click "Generate Ads" above — you'll land directly on the content page for this campaign.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets.slice(0, 3).map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg leading-snug flex-1 pr-4">
                          {asset.headline}
                        </h4>
                        <Badge
                          variant={
                            asset.status === "approved"
                              ? "default"
                              : asset.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize shrink-0"
                        >
                          {asset.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{asset.shortCaption}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {asset.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
                        <span className="font-medium text-primary text-xs uppercase tracking-wide">
                          CTA
                        </span>
                        {asset.cta}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    To approve or request edits on individual ads, use the{" "}
                    <Link
                      href={`/content-studio?campaignId=${campaignId}`}
                      className="text-primary hover:underline"
                    >
                      Content page
                    </Link>
                    .
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publish tab */}
        <TabsContent value="publish" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Publish Checklist
                </CardTitle>
                {isPublished && (
                  <Badge className="bg-green-600 text-white hover:bg-green-600">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Published
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPublished ? (
                <>
                  <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-400">
                          Campaign is live
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This campaign has been marked as published and is now active.
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-green-500/10">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Published at</p>
                        <p className="text-sm font-medium">
                          {campaign.publishedAt
                            ? format(new Date(campaign.publishedAt), "MMM d, yyyy 'at' h:mm a")
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Published by</p>
                        <p className="text-sm font-medium">{campaign.publishedBy ?? "—"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Channels</p>
                        <div className="flex flex-wrap gap-2">
                          {(campaign.publishedChannels ?? []).map((ch) => (
                            <Badge key={ch} variant="outline" className="capitalize">
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-start gap-2 border rounded-lg p-4 bg-muted/10">
                    <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      This is a demo publish — no real ads have been created on any ad platform.
                      Performance data will populate in the Reports page as simulated metrics.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Checklist */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Complete these steps before publishing:
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Campaign created", done: true },
                        { label: "Ad content generated", done: hasAssets },
                        { label: "Content reviewed in Content Studio", done: hasAssets && (assets?.some((a) => a.status === "approved") ?? false) },
                        { label: "Campaign marked as ready (approved)", done: isApproved },
                        { label: "Approved creative asset/reference with usage rights", done: hasApprovedCreativeAsset && hasUsageRightsNotes },
                        { label: "Tracking link or landing URL", done: hasTrackingLink || Boolean(campaign.landingUrl) },
                        { label: "Selected channels", done: hasSelectedChannels },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-3 text-sm">
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                              done ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                          <span className={done ? "text-foreground" : "text-muted-foreground"}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isApproved ? (
                    <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-400">
                      <p className="font-medium mb-1">Campaign not yet approved</p>
                      <p className="text-amber-700/80 dark:text-amber-400/80">
                        You need to mark the campaign as ready before publishing. Review and approve
                        individual ads in the Content page first, then add an approved creative asset/reference
                        with usage rights notes, tracking, and channels before clicking "Mark Campaign Ready".
                      </p>
                    </div>
                  ) : !hasApprovedAd ? (
                    <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-400">
                      <p className="font-medium mb-1">No individual ads approved yet</p>
                      <p className="text-amber-700/80 dark:text-amber-400/80">
                        Approve at least one ad in the{" "}
                        <Link
                          href={`/content-studio?campaignId=${campaignId}`}
                          className="font-semibold underline underline-offset-2"
                        >
                          Content page
                        </Link>{" "}
                        before publishing.
                      </p>
                    </div>
                  ) : !hasApprovedCreativeAsset ? (
                    <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-400">
                      <p className="font-medium mb-1">No approved creative asset/reference yet</p>
                      <p className="text-amber-700/80 dark:text-amber-400/80">
                        Add and approve a creative asset/reference with usage rights notes in the{" "}
                        <Link href="#creative-assets" className="font-semibold underline underline-offset-2">
                          Creative Assets
                        </Link>{" "}
                        tab before publishing.
                      </p>
                    </div>
                  ) : !isViewer ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground flex items-start gap-2">
                        <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          This is a demo environment — no real ads will be created. Clicking "Publish"
                          records the publish event and moves the campaign to Active status for demo
                          purposes.
                        </span>
                      </div>
                      <Button
                        onClick={openPublishDialog}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!manualPublishReady}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Publish Campaign
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ask an admin or editor to publish this campaign.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creative-assets" className="mt-4">
          <CampaignCreativeAssets campaignId={campaignId} isViewer={isViewer} />
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tracking Links</CardTitle>
                {!isViewer && (
                  <Button size="sm" onClick={openLinkDialog}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Generate Link
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!trackingLinks || trackingLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                  <LinkIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-medium mb-1">No tracking links yet</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Tracking links help you measure where clicks come from.
                  </p>
                  {!isViewer && (
                    <Button variant="outline" onClick={openLinkDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Your First Link
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="capitalize">
                            {link.channel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {link.source} / {link.medium}
                          </span>
                        </div>
                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                          {link.generatedTrackingUrl}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(link.generatedTrackingUrl);
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
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

      {/* Manual Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Publish Campaign
            </DialogTitle>
            <DialogDescription>
              Select which channels you're publishing to and confirm. This is a demo — no real ads
              will be created on any ad platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Channels <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PUBLISH_CHANNELS.map((ch) => (
                  <div
                    key={ch}
                    className="flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => togglePublishChannel(ch)}
                  >
                    <Checkbox
                      id={`ch-${ch}`}
                      checked={publishChannels.includes(ch)}
                      onCheckedChange={() => togglePublishChannel(ch)}
                    />
                    <label
                      htmlFor={`ch-${ch}`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {ch}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-notes" className="text-sm font-medium">
                Publish notes (optional)
              </Label>
              <Textarea
                id="publish-notes"
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="e.g. Approved by client on 5 May, using assets variant A…"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Demo only — this records the publish event for tracking purposes but does not
                create real ads, spend any budget, or connect to any ad platform.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleManualPublish}
              disabled={manualPublishCampaign.isPending || publishChannels.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {manualPublishCampaign.isPending ? "Publishing…" : "Confirm Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Tracking Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Tracking Link</DialogTitle>
            <DialogDescription>
              Create a UTM tracking link for this campaign. The campaign is pre-selected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Campaign — locked */}
            <div className="space-y-1.5">
              <Label>Campaign</Label>
              <Input value={campaign.name} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">
                This link will be tracked to the current campaign.
              </p>
            </div>

            {/* Channel */}
            <div className="space-y-1.5">
              <Label htmlFor="link-channel">
                Channel <span className="text-destructive">*</span>
              </Label>
              <Select value={linkChannel} onValueChange={(v) => { setLinkChannel(v); setLinkSource(v); }}>
                <SelectTrigger id="link-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_CHANNELS.map((ch) => (
                    <SelectItem key={ch} value={ch} className="capitalize">
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Source */}
              <div className="space-y-1.5">
                <Label htmlFor="link-source">
                  Source <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="link-source"
                  value={linkSource}
                  onChange={(e) => setLinkSource(e.target.value)}
                  placeholder="instagram"
                />
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <Label htmlFor="link-medium">
                  Medium <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="link-medium"
                  value={linkMedium}
                  onChange={(e) => setLinkMedium(e.target.value)}
                  placeholder="paid"
                />
              </div>
            </div>

            {/* UTM Campaign name */}
            <div className="space-y-1.5">
              <Label htmlFor="link-campaign">
                UTM Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="link-campaign"
                value={linkCampaignName}
                onChange={(e) => setLinkCampaignName(e.target.value)}
                placeholder="summer-launch"
              />
            </div>

            {/* Content (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="link-content">UTM Content (optional)</Label>
              <Input
                id="link-content"
                value={linkContent}
                onChange={(e) => setLinkContent(e.target.value)}
                placeholder="variant-a"
              />
            </div>

            {/* Final URL */}
            <div className="space-y-1.5">
              <Label htmlFor="link-url">
                Destination URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="link-url"
                value={linkFinalUrl}
                onChange={(e) => setLinkFinalUrl(e.target.value)}
                placeholder="https://example.com/landing"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLink} disabled={createTrackingLink.isPending}>
              {createTrackingLink.isPending ? "Creating…" : "Create Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
