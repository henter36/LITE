import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetCampaign,
  useListAssets,
  useApproveCampaign,
  useListTrackingLinks,
  getGetCampaignQueryKey,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const variancePct = expectedSpend > 0 ? ((simulatedSpend - expectedSpend) / expectedSpend) * 100 : 0;

  let verdict: "On Pace" | "Underspending" | "Overspending";
  if (variancePct < -15) verdict = "Underspending";
  else if (variancePct > 15) verdict = "Overspending";
  else verdict = "On Pace";

  const daysRemaining = Math.max(differenceInDays(end, today), 0);

  return { totalDays, daysElapsed, daysRemaining, progressPct, expectedSpend, simulatedSpend, variancePct, verdict };
}

const FLOW_STEPS = [
  { label: "Create Campaign", icon: Megaphone },
  { label: "Generate Ads", icon: PenTool },
  { label: "Approve", icon: CheckCircle },
  { label: "Performance", icon: BarChart3 },
];

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaign, isLoading: isCampaignLoading } = useGetCampaign(campaignId, {
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) },
  });

  const { data: assets, isLoading: isAssetsLoading } = useListAssets(
    { campaignId },
    { query: { enabled: !!campaignId, queryKey: getListAssetsQueryKey({ campaignId }) } }
  );

  const { data: trackingLinks } = useListTrackingLinks({ campaignId });
  const approveCampaign = useApproveCampaign();

  const handleApprove = () => {
    approveCampaign.mutate(
      { id: campaignId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
          toast({ title: "Campaign approved" });
        },
      }
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
          <p className="text-muted-foreground mt-2">This campaign doesn't exist or you don't have access.</p>
          <Link href="/campaigns">
            <Button className="mt-4">Back to Campaigns</Button>
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const pacing = computeBudgetPacing(campaign.budgetSuggestion, campaign.startDate, campaign.endDate);

  const verdictColor =
    pacing.verdict === "On Pace"
      ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400"
      : pacing.verdict === "Overspending"
      ? "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400"
      : "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";

  const VerdictIcon =
    pacing.verdict === "On Pace" ? Minus : pacing.verdict === "Overspending" ? TrendingUp : TrendingDown;

  const hasAssets = !isAssetsLoading && (assets?.length ?? 0) > 0;
  const isApproved = campaign.status === "approved" || campaign.status === "active";

  const completedSteps = [
    true,
    hasAssets,
    isApproved,
    false,
  ];
  const currentStep = completedSteps.findIndex((done) => !done);
  const effectiveStep = currentStep === -1 ? 4 : currentStep;

  return (
    <SidebarLayout>
      <div>
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge
                variant={campaign.status === "active" || campaign.status === "approved" ? "default" : "secondary"}
                className="capitalize"
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-base capitalize">{campaign.objective} campaign</p>
          </div>
          {!isApproved && (
            <Button onClick={handleApprove} disabled={approveCampaign.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {approveCampaign.isPending ? "Approving..." : "Approve Campaign"}
            </Button>
          )}
        </div>
      </div>

      {/* Campaign flow indicator */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {FLOW_STEPS.map((step, i) => {
          const done = i < effectiveStep;
          const active = i === effectiveStep;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  ${done ? "bg-primary/10 text-primary" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {step.label}
              </div>
              {i < FLOW_STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1 shrink-0" />}
            </div>
          );
        })}
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
                {format(parseISO(campaign.startDate), "MMM d")} – {format(parseISO(campaign.endDate), "MMM d, yyyy")}
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
              <p className="text-2xl font-bold">${campaign.budgetSuggestion.toLocaleString()}</p>
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
                  <span>Day {pacing.daysElapsed} of {pacing.totalDays}</span>
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

      {/* Tabs: Ad Content + Tracking Links */}
      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Ad Content</TabsTrigger>
          <TabsTrigger value="links">Tracking Links</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Content</CardTitle>
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
                  <p className="text-muted-foreground text-sm mb-4">Go to the Content page to generate ads for this campaign.</p>
                  <Link href="/content-studio">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Ads
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets.slice(0, 3).map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg leading-snug flex-1 pr-4">{asset.headline}</h4>
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
                          <span key={tag} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg text-sm">
                        <span className="font-medium text-primary text-xs uppercase tracking-wide mr-2">CTA</span>
                        {asset.cta}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Links</CardTitle>
            </CardHeader>
            <CardContent>
              {!trackingLinks || trackingLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                  <LinkIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-medium mb-1">No tracking links yet</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Tracking links help you measure where clicks come from.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Manage Tracking Links
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks.map((link) => (
                    <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="capitalize">{link.channel}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {link.source} / {link.medium}
                          </span>
                        </div>
                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">{link.generatedTrackingUrl}</p>
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
    </SidebarLayout>
  );
}
