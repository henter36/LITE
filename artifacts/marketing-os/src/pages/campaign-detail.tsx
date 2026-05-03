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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CampaignWorkflowTab, WorkflowStatusPanel, type WorkflowStatusSummary } from "./campaign-workflow-tab";
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
                      className="text-xs text-emerald-700 flex items-center gap-1 hover:underline mt-1 max-w-xs truncate"
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
type AITextAssistOutput = {
  hooks: string[];
  adCopyVariants: string[];
  captions: string[];
  ctas: string[];
  improvementNotes: string[];
  missingContextWarnings: string[];
  safetyNotes: string[];
};

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
  const [aiAssistLoading, setAiAssistLoading] = useState(false);
  const [aiAssistResult, setAiAssistResult] = useState<AITextAssistOutput | null>(null);
  const [aiAssistError, setAiAssistError] = useState<string | null>(null);
  const [aiAssistStatus, setAiAssistStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatusSummary>({
    intake: "not_started",
    strategyBrief: "not_started",
    creativeBrief: "not_started",
    textSuggestions: "not_started",
    imagePromptSpecs: "not_started",
    videoScriptSpecs: "not_started",
  });

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
          toast({ title: "تم إنشاء رابط التتبع", description: "جاهز للنسخ والاستخدام." });
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

  const handleGenerateTextAssist = async () => {
    if (isViewer) {
      setAiAssistStatus("error");
      setAiAssistError("View-only access: ask an editor to generate AI suggestions.");
      return;
    }
    if (!campaign) {
      setAiAssistStatus("error");
      setAiAssistError("Campaign context is unavailable.");
      return;
    }
    setAiAssistLoading(true);
    setAiAssistError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/strategy/text-assist`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: campaign.workspaceId, campaignId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if ((data as { code?: string }).code === "AI_TEXT_UNAVAILABLE") {
          setAiAssistStatus("unavailable");
          setAiAssistResult((data as { output?: AITextAssistOutput }).output ?? null);
          return;
        }
        throw new Error((data as { error?: string }).error ?? "Failed to generate AI suggestions.");
      }
      if ((data as { output?: AITextAssistOutput }).output) {
        setAiAssistStatus("ready");
        setAiAssistResult((data as { output?: AITextAssistOutput }).output ?? null);
      } else {
        setAiAssistStatus("error");
        setAiAssistError("AI suggestions returned no output.");
      }
    } catch (error) {
      setAiAssistStatus("error");
      setAiAssistError(error instanceof Error ? error.message : "Failed to generate AI suggestions.");
    } finally {
      setAiAssistLoading(false);
    }
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
  const approvedCreativeAssetCount = 0;
  const completionState = {
    strategySummary:
      campaign.objective && campaign.audience && campaign.productService
        ? `${campaign.objective} • ${campaign.audience} • ${campaign.productService}`
        : "",
    hasApprovedAd: approvedAdCount > 0,
    isReady: campaign.status === "approved" || campaign.status === "active",
    isPublished: campaign.status === "active" && !!campaign.publishedAt,
    approvedCreativeAssetCount,
    hasApprovedCreativeAsset: approvedCreativeAssetCount > 0,
    hasUsageRightsNotes: approvedCreativeAssetCount > 0,
    hasTrackingLink: (trackingLinks?.length ?? 0) > 0,
    hasSelectedChannels: (campaign.channels?.length ?? 0) > 0,
  };
  const hasApprovedAd = completionState.hasApprovedAd;
  const isApproved = completionState.isReady;
  const isPublished = completionState.isPublished;
  const strategySummary = completionState.strategySummary;
  const hasStrategyContext = Boolean(completionState.strategySummary);
  const hasApprovedCreativeAsset = completionState.hasApprovedCreativeAsset;
  const hasTrackingLink = completionState.hasTrackingLink;
  const hasSelectedChannels = completionState.hasSelectedChannels;
  const hasUsageRightsNotes = completionState.hasUsageRightsNotes;
  const readinessRequirements = [
    { label: "سياق الاستراتيجية", ok: Boolean(completionState.strategySummary) },
    { label: "الإعلانات المعتمدة", ok: completionState.hasApprovedAd },
    { label: "الحملة معلّمة كجاهزة", ok: completionState.isReady },
    {
      label: "أصل/مرجع إبداعي معتمد",
      ok: completionState.hasApprovedCreativeAsset && completionState.hasUsageRightsNotes,
    },
    { label: "رابط تتبع أو صفحة هبوط", ok: completionState.hasTrackingLink || Boolean(campaign.landingUrl) },
    { label: "القنوات المحددة", ok: completionState.hasSelectedChannels },
  ];
  const readinessScore = Math.round(
    (readinessRequirements.filter((item) => item.ok).length / readinessRequirements.length) * 100,
  );

  // 5-step flow: إعداد (0) → توليد (1) → اعتماد (2) → نشر (3) → أداء (4)
  const completedSteps = [true, hasAssets, isApproved, isPublished, hasMetrics];
  const currentStep = completedSteps.findIndex((done) => !done);
  const effectiveStep = currentStep === -1 ? 5 : currentStep;

  const FLOW_STEPS = [
    { label: "إعداد الحملة", icon: Megaphone, href: null, nextAction: null },
    {
      label: "توليد نصوص إعلانية",
      icon: PenTool,
      href: `/content-studio?campaignId=${campaignId}`,
      nextAction: "انتقل إلى استوديو المحتوى لتوليد الإعلانات →",
    },
    {
      label: "اعتماد",
      icon: CheckCircle,
      href: null,
      nextAction: "راجع الإعلانات ثم اضغط «تأكيد جاهزية الحملة» أعلاه",
    },
    {
      label: "النشر اليدوي",
      icon: Send,
      href: null,
      nextAction: "تم اعتماد الحملة — افتح تبويب النشر اليدوي",
    },
    {
      label: "الأداء",
      icon: BarChart3,
      href: `/reports`,
      nextAction: "عرض بيانات الأداء التجريبية →",
    },
  ];

  const activeStep = effectiveStep < FLOW_STEPS.length ? FLOW_STEPS[effectiveStep] : null;
  const manualPublishReady =
    completionState.hasApprovedAd &&
    completionState.isReady &&
    completionState.hasApprovedCreativeAsset &&
    completionState.hasUsageRightsNotes &&
    (completionState.hasTrackingLink || Boolean(campaign.landingUrl)) &&
    completionState.hasSelectedChannels &&
    !isViewer;

  return (
    <SidebarLayout>
      <div className="space-y-6 overflow-x-hidden" dir="rtl">

        {/* Read-only viewer banner */}
        {isViewer && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            <EyeOff className="h-4 w-4 shrink-0" />
            <span>عرض للقراءة فقط — يمكنك مراجعة تفاصيل الحملة لكن لا يمكنك تعديلها.</span>
          </div>
        )}

        {/* ── Hero header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Megaphone className="h-3.5 w-3.5" />
              الحملات الإعلانية
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{campaign.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={campaign.status === "active" || campaign.status === "approved" ? "default" : "secondary"}
                className="capitalize"
              >
                {campaign.status}
              </Badge>
              <Badge variant="outline" className="capitalize text-emerald-700 border-emerald-200 bg-white">
                {campaign.objective}
              </Badge>
              <Badge variant="outline" className={manualPublishReady ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : ""}>
                {manualPublishReady ? "جاهزة للنشر اليدوي" : "غير جاهزة"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isViewer && !isApproved && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleApprove} disabled={approveCampaign.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {approveCampaign.isPending ? "جارٍ الحفظ…" : "تأكيد جاهزية الحملة"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-center">
                  يؤكد أن الحملة تمت مراجعتها بالكامل وهي جاهزة للتنفيذ. مختلف عن اعتماد الإعلانات الفردية.
                </TooltipContent>
              </Tooltip>
            )}
            {isApproved && !isPublished && !isViewer && (
              <Button
                onClick={openPublishDialog}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!manualPublishReady}
              >
                <Rocket className="mr-2 h-4 w-4" />
                النشر اليدوي
              </Button>
            )}
            {isPublished && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 flex items-center gap-1.5 px-3 py-1.5">
                <Check className="h-3.5 w-3.5" />
                منشورة
              </Badge>
            )}
            {isApproved && !isPublished && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 px-3 py-1.5">
                <Check className="h-3.5 w-3.5" />
                جاهزة
              </Badge>
            )}
          </div>
        </div>

        {/* ── Top two-column grid: Completion card + AI Assist card ── */}
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Campaign Completion card */}
          <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  جاهزية الحملة
                </CardTitle>
                <Badge variant="outline" className={manualPublishReady ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : ""}>
                  {readinessScore}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategySummary && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">ملخص الاستراتيجية:</span> {strategySummary}
                </p>
              )}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
                {[
                    { label: "سياق الاستراتيجية", value: hasStrategyContext ? "جاهز" : "ناقص", ok: hasStrategyContext },
                    { label: "الإعلانات المعتمدة", value: hasApprovedAd ? "مكتمل" : "ناقص", ok: hasApprovedAd },
                    { label: "أصل/مرجع إبداعي معتمد", value: hasApprovedCreativeAsset ? `${approvedCreativeAssetCount} مكتمل` : "ناقص", ok: hasApprovedCreativeAsset },
                    { label: "رابط تتبع أو صفحة هبوط", value: hasTrackingLink || campaign.landingUrl ? "مكتمل" : "ناقص", ok: !!(hasTrackingLink || campaign.landingUrl) },
                    { label: "الحملة معلّمة كجاهزة", value: isApproved ? "جاهز" : "ناقص", ok: isApproved },
                    { label: "النشر اليدوي", value: manualPublishReady ? "مسموح" : "محجوب", ok: manualPublishReady },
                ].map(({ label, value, ok }) => (
                  <div key={label} className={`rounded-xl border p-3 ${ok ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white"}`}>
                    <p className="text-muted-foreground text-xs mb-1">{label}</p>
                    <p className={`font-medium text-sm ${ok ? "text-emerald-700" : "text-slate-700"}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">مقياس الجاهزية</p>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{readinessScore}%</Badge>
                </div>
                <Progress value={readinessScore} className="h-2" />
                <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                  {readinessRequirements.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={item.ok ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                        {item.ok ? "مكتمل" : "ناقص"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <WorkflowStatusPanel status={workflowStatus} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/strategy">
                  <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">صفحة الاستراتيجية</Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">مكتبة الأصول الإعلانية</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Assist card */}
          <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                مساعد الذكاء الاصطناعي
              </CardTitle>
              <CardDescription>مسودة فقط — لا يعتمد المحتوى ولا ينشر الحملة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateTextAssist}
                disabled={aiAssistLoading || isViewer}
                className="w-full"
              >
                {aiAssistLoading ? "جارٍ التوليد…" : "توليد اقتراحات نصية"}
              </Button>
              {aiAssistStatus === "unavailable" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
                  المساعد غير متاح حتى يتم تكوين الذكاء الاصطناعي على الخادم.
                </div>
              )}
              {aiAssistError && aiAssistStatus === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-700">
                  {aiAssistError}
                </div>
              )}
              {aiAssistResult ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["الخطافات", aiAssistResult.hooks],
                    ["نسخ إعلانية", aiAssistResult.adCopyVariants],
                    ["التعليقات", aiAssistResult.captions],
                    ["النداءات إلى الإجراء", aiAssistResult.ctas],
                    ["ملاحظات التحسين", aiAssistResult.improvementNotes],
                    ["السياق الناقص", aiAssistResult.missingContextWarnings],
                    ["ملاحظات السلامة", aiAssistResult.safetyNotes],
                  ].map(([label, items]) => (
                    <div key={String(label)} className="rounded-xl border border-emerald-100 bg-white p-4">
                      <p className="font-medium mb-2 text-sm">{label}</p>
                      <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                        {(items as string[]).length > 0
                          ? (items as string[]).map((item) => <li key={item}>{item}</li>)
                          : <li>لا توجد اقتراحات.</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 mb-2">معاينة</p>
                  <p className="text-base leading-7 text-slate-800">
                    أنشئ رسائل إعلانية واثقة وواضحة تعكس شخصية <span className="font-semibold">{campaign.name}</span> وتخاطب {campaign.audience}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Flow indicator + next action ── */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            {FLOW_STEPS.map((step, i) => {
              const done = i < effectiveStep;
              const active = i === effectiveStep;
              const Icon = step.icon;
              const pill = (
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                  done ? "bg-emerald-50 text-emerald-700" : active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  {step.label}
                  {active && step.href && <ArrowRight className="h-3 w-3 ml-0.5" />}
                </div>
              );
              return (
                <div key={step.label} className="flex items-center">
                  {active && step.href ? <Link href={step.href}>{pill}</Link> : pill}
                  {i < FLOW_STEPS.length - 1 && <div className="w-4 h-px bg-emerald-100 mx-2 shrink-0" />}
                </div>
              );
            })}
          </div>
          {effectiveStep < FLOW_STEPS.length && activeStep?.nextAction && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
              {activeStep.href ? (
                <Link href={activeStep.href} className="flex items-center gap-1.5 font-medium hover:underline">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {activeStep.nextAction}
                </Link>
              ) : (
                <>
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  {activeStep.nextAction}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Campaign Brief + Budget Pacing ── */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Target className="h-4 w-4 text-emerald-600" />
                تفاصيل الحملة
              </CardTitle>
              <CardDescription>الهدف، الجمهور، النطاق، والقنوات.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Target className="h-3 w-3" /> الهدف
                </p>
                <p className="capitalize font-medium">{campaign.objective}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Users className="h-3 w-3" /> الجمهور المستهدف
                </p>
                <p className="font-medium">{campaign.audience}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <MapPin className="h-3 w-3" /> الموقع الجغرافي
                </p>
                <p className="font-medium">{campaign.geography}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Calendar className="h-3 w-3" /> المدة
                </p>
                <p className="font-medium">
                  {campaign.startDate ? format(parseISO(campaign.startDate), "MMM d") : "—"} –{" "}
                  {campaign.endDate ? format(parseISO(campaign.endDate), "MMM d, yyyy") : "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">ما يتم الترويج له</p>
                <p className="text-sm leading-relaxed">{campaign.productService}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">القنوات</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.channels.map((c) => (
                    <Badge key={c} variant="outline" className="capitalize rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">توزيع الميزانية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">الميزانية المخططة</p>
                <p className="text-2xl font-bold text-slate-900">${(campaign.budgetSuggestion ?? 0).toLocaleString()}</p>
              </div>
              <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">وتيرة الإنفاق</p>
                  <Badge variant="outline" className={`text-xs font-medium ${verdictColor}`}>
                    <VerdictIcon className="h-3 w-3 mr-1" />
                    {pacing.verdict}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>اليوم {pacing.daysElapsed} من {pacing.totalDays}</span>
                    <span>متبقي {pacing.daysRemaining}د</span>
                  </div>
                  <Progress value={pacing.progressPct * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-emerald-100 bg-white p-2">
                    <p className="text-muted-foreground mb-0.5">الإنفاق التجريبي</p>
                    <p className="font-semibold text-sm">${pacing.simulatedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white p-2">
                    <p className="text-muted-foreground mb-0.5">المتوقع</p>
                    <p className="font-semibold text-sm">${pacing.expectedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FlaskConical className="h-3 w-3 shrink-0" />
                  بيانات تجريبية محاكاة فقط
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="workflow">
          <TabsList>
            <TabsTrigger value="workflow">سير عمل الذكاء الاصطناعي</TabsTrigger>
            <TabsTrigger value="assets">محتوى الإعلانات</TabsTrigger>
            <TabsTrigger value="publish">النشر</TabsTrigger>
            <TabsTrigger value="links">روابط التتبع</TabsTrigger>
            <TabsTrigger value="creative-assets">الأصول الإبداعية</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-4">
            <CampaignWorkflowTab
              workspaceId={campaign.workspaceId}
              campaignId={campaignId}
              campaignName={campaign.name}
              isViewer={isViewer}
              onStatusChange={setWorkflowStatus}
            />
          </TabsContent>

          <TabsContent value="assets" className="mt-4">
            <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg text-slate-900">محتوى الإعلانات</CardTitle>
                    {hasAssets && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {approvedAdCount} من {assets?.length ?? 0} إعلان معتمد
                      </p>
                    )}
                  </div>
                  {!isViewer && (!assets || assets.length === 0) && (
                    <Link href={`/content-studio?campaignId=${campaignId}`}>
                      <Button size="sm">
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        توليد الإعلانات
                      </Button>
                    </Link>
                  )}
                  {assets && assets.length > 0 && (
                    <Link href={`/content-studio?campaignId=${campaignId}`}>
                      <Button size="sm" variant="outline">
                        <PenTool className="mr-2 h-3.5 w-3.5" />
                        {isViewer ? "عرض في صفحة المحتوى" : "مراجعة في صفحة المحتوى"}
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
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl border-emerald-100">
                    <PenTool className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="font-medium mb-1">لم يتم توليد إعلانات بعد</p>
                    <p className="text-muted-foreground text-sm mb-4">
                      {isViewer
                        ? "لم يتم توليد محتوى إعلاني لهذه الحملة."
                        : `انقر على "توليد الإعلانات" للانتقال مباشرةً إلى صفحة المحتوى.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assets.slice(0, 3).map((asset) => (
                      <div key={asset.id} className="border border-emerald-100 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg leading-snug flex-1 pr-4">{asset.headline}</h4>
                          <Badge
                            variant={asset.status === "approved" ? "default" : asset.status === "rejected" ? "destructive" : "secondary"}
                            className="capitalize shrink-0"
                          >
                            {asset.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{asset.shortCaption}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {asset.hashtags.map((tag) => (
                            <span key={tag} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
                          <span className="font-semibold text-emerald-700 text-xs uppercase tracking-wide">CTA</span>
                          {asset.cta}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      لاعتماد الإعلانات أو طلب تعديلات، استخدم{" "}
                      <Link href={`/content-studio?campaignId=${campaignId}`} className="text-emerald-600 hover:underline">
                        صفحة المحتوى
                      </Link>.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publish tab */}
          <TabsContent value="publish" className="mt-4">
            <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
              <CardHeader>
                <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                قائمة متطلبات النشر
              </CardTitle>
                  {isPublished && (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      منشورة
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isPublished ? (
                  <>
                    <div className="rounded-xl border border-green-200 bg-green-50/60 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                      <p className="font-semibold text-green-800">الحملة مباشرة</p>
                          <p className="text-sm text-muted-foreground">تم تعيين الحملة كمنشورة وهي الآن نشطة.</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-green-200">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">تاريخ النشر</p>
                          <p className="text-sm font-medium">
                            {campaign.publishedAt ? format(new Date(campaign.publishedAt), "MMM d, yyyy 'at' h:mm a") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">نُشرت بواسطة</p>
                          <p className="text-sm font-medium">{campaign.publishedBy ?? "—"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">القنوات</p>
                          <div className="flex flex-wrap gap-2">
                            {(campaign.publishedChannels ?? []).map((ch) => (
                              <Badge key={ch} variant="outline" className="capitalize rounded-full">{ch}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-start gap-2 rounded-xl border border-emerald-100 p-4 bg-muted/10">
                      <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>هذا نشر تجريبي — لم يتم إنشاء إعلانات حقيقية على أي منصة.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">أكمل هذه الخطوات قبل النشر:</p>
                      <div className="space-y-2">
                        {[
                          { label: "تم إنشاء الحملة", done: true },
                          { label: "تم توليد محتوى الإعلانات", done: hasAssets },
                          { label: "تم مراجعة المحتوى في Content Studio", done: hasAssets && (assets?.some((a) => a.status === "approved") ?? false) },
                          { label: "تم تعيين الحملة كجاهزة (معتمدة)", done: isApproved },
                          { label: "أصل إبداعي معتمد مع ملاحظات حقوق الاستخدام", done: hasApprovedCreativeAsset && hasUsageRightsNotes },
                          { label: "رابط تتبع أو عنوان صفحة هبوط", done: hasTrackingLink || Boolean(campaign.landingUrl) },
                          { label: "قنوات محددة", done: hasSelectedChannels },
                        ].map(({ label, done }) => (
                          <div key={label} className="flex items-center gap-3 text-sm">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                              {done ? <Check className="h-3 w-3" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                            </div>
                            <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isApproved ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
                        <p className="font-medium mb-1">الحملة غير معتمدة بعد</p>
                        <p className="text-amber-700/80">راجع واعتمد الإعلانات الفردية في صفحة المحتوى أولاً، ثم أضف أصلاً إبداعياً معتمداً مع ملاحظات الاستخدام والتتبع والقنوات قبل النقر على "تأكيد جاهزية الحملة".</p>
                      </div>
                    ) : !hasApprovedAd ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
                        <p className="font-medium mb-1">لا توجد إعلانات معتمدة بعد</p>
                        <p className="text-amber-700/80">
                          اعتمد إعلاناً واحداً على الأقل في{" "}
                          <Link href={`/content-studio?campaignId=${campaignId}`} className="font-semibold underline underline-offset-2">صفحة المحتوى</Link>{" "}
                          قبل النشر.
                        </p>
                      </div>
                    ) : !hasApprovedCreativeAsset ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
                        <p className="font-medium mb-1">لا يوجد أصل إبداعي معتمد بعد</p>
                        <p className="text-amber-700/80">
                          أضف أصلاً إبداعياً معتمداً مع ملاحظات حقوق الاستخدام في تبويب{" "}
                          <Link href="#creative-assets" className="font-semibold underline underline-offset-2">الأصول الإبداعية</Link>{" "}
                          قبل النشر.
                        </p>
                      </div>
                    ) : !isViewer ? (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-100 bg-muted/10 p-4 text-sm text-muted-foreground flex items-start gap-2">
                          <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>بيئة تجريبية — لن يتم إنشاء إعلانات حقيقية. النشر يسجل الحدث ويحرك الحملة إلى حالة نشطة.</span>
                        </div>
                            <Button
                          onClick={openPublishDialog}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={!manualPublishReady}
                        >
                          <Rocket className="mr-2 h-4 w-4" />
                          نشر الحملة
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">اطلب من مدير أو محرر نشر هذه الحملة.</p>
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
            <Card className="border-emerald-100 bg-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900">روابط التتبع</CardTitle>
                  {!isViewer && (
                    <Button size="sm" onClick={openLinkDialog}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      إنشاء رابط
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!trackingLinks || trackingLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl border-emerald-100">
                    <LinkIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="font-medium mb-1">لا توجد روابط تتبع بعد</p>
                    <p className="text-muted-foreground text-sm mb-4">تساعد روابط التتبع في قياس مصادر النقرات.</p>
                    {!isViewer && (
                      <Button variant="outline" onClick={openLinkDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        أنشئ أول رابط
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trackingLinks.map((link) => (
                      <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-emerald-100 rounded-xl p-4 gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className="capitalize rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">{link.channel}</Badge>
                            <span className="text-xs text-muted-foreground">{link.source} / {link.medium}</span>
                          </div>
                          <p className="text-xs font-mono bg-muted p-2 rounded break-all">{link.generatedTrackingUrl}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(link.generatedTrackingUrl);
                            toast({ title: "تم النسخ إلى الحافظة" });
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          نسخ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>

      {/* Manual Publish Dialog — behavior unchanged */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              النشر اليدوي للحملة
            </DialogTitle>
            <DialogDescription>
              اختر القنوات التي ستنشر عليها ثم أكّد. هذا عرض تجريبي — لن يتم إنشاء إعلانات حقيقية على أي منصة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                القنوات <span className="text-destructive">*</span>
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
                    <label htmlFor={`ch-${ch}`} className="text-sm font-medium capitalize cursor-pointer">
                      {ch}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-notes" className="text-sm font-medium">
                ملاحظات النشر (اختيارية)
              </Label>
              <Textarea
                id="publish-notes"
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="مثال: تمت الموافقة من العميل في 5 مايو، باستخدام النسخة A…"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                تجريبي فقط — هذا يسجل حدث النشر لأغراض التتبع لكنه لا ينشئ إعلانات حقيقية ولا ينفق ميزانية ولا يتصل بأي منصة إعلانية.
              </span>
            </div>
          </div>

          <DialogFooter>
              <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleManualPublish}
              disabled={manualPublishCampaign.isPending || publishChannels.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {manualPublishCampaign.isPending ? "جارٍ النشر…" : "تأكيد النشر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Tracking Link Dialog — behavior unchanged */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>توليد رابط التتبع</DialogTitle>
            <DialogDescription>
              أنشئ رابط تتبع UTM لهذه الحملة. الحملة محددة مسبقاً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>الحملة</Label>
              <Input value={campaign.name} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">سيتم تتبع هذا الرابط على الحملة الحالية.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link-channel">القناة <span className="text-destructive">*</span></Label>
              <Select value={linkChannel} onValueChange={(v) => { setLinkChannel(v); setLinkSource(v); }}>
                <SelectTrigger id="link-channel"><SelectValue /></SelectTrigger>
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
              <div className="space-y-1.5">
              <Label htmlFor="link-source">المصدر <span className="text-destructive">*</span></Label>
                <Input id="link-source" value={linkSource} onChange={(e) => setLinkSource(e.target.value)} placeholder="instagram" />
              </div>
              <div className="space-y-1.5">
              <Label htmlFor="link-medium">الوسيط <span className="text-destructive">*</span></Label>
                <Input id="link-medium" value={linkMedium} onChange={(e) => setLinkMedium(e.target.value)} placeholder="paid" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link-campaign">اسم حملة UTM <span className="text-destructive">*</span></Label>
              <Input id="link-campaign" value={linkCampaignName} onChange={(e) => setLinkCampaignName(e.target.value)} placeholder="summer-launch" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link-content">محتوى UTM (اختياري)</Label>
              <Input id="link-content" value={linkContent} onChange={(e) => setLinkContent(e.target.value)} placeholder="variant-a" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link-url">رابط الوجهة <span className="text-destructive">*</span></Label>
              <Input id="link-url" value={linkFinalUrl} onChange={(e) => setLinkFinalUrl(e.target.value)} placeholder="https://example.com/landing" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateLink} disabled={createTrackingLink.isPending}>
              {createTrackingLink.isPending ? "جارٍ الإنشاء…" : "إنشاء الرابط"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
