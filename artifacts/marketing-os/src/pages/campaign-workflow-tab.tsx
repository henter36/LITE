import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  ClipboardList,
  Target,
  PenTool,
  Image,
  Video,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowIntake {
  businessDescription: string;
  campaignObjective: string;
  targetAudience: string;
  offerValueProposition: string;
  brandTone: string;
  landingUrl: string;
  constraintsForbiddenClaims: string;
  availableCreativeAssets: string;
  missingInformation: string;
}

export interface WorkflowStrategyBrief {
  objective: string;
  targetAudience: string;
  positioning: string;
  keyMessage: string;
  recommendedChannels: string[];
  contentAngles: string[];
  ctaDirection: string;
  requiredAssets: string[];
  missingContextWarnings: string[];
  risksSafetyNotes: string[];
}

export interface WorkflowCreativeBrief {
  coreMessage: string;
  audience: string;
  tone: string;
  textDirection: string;
  visualDirection: string;
  videoDirection: string;
  channelAdaptations: string[];
  usageRightsReminders: string[];
  prohibitedElements: string[];
}

export interface WorkflowImagePromptSpecs {
  imagePrompts: string[];
  compositionNotes: string;
  styleDirection: string;
  productSceneNotes: string;
  channelFormatNotes: string[];
  usageRightsReminders: string[];
}

export interface WorkflowVideoScriptSpecs {
  videoConcept: string;
  shortScript: string;
  storyboardOutline: string;
  sceneList: string[];
  voiceoverDraft: string;
  captionDraft: string;
  platformAspectRatioNotes: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

async function wfFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function parseJsonField<T>(value: string | T[]): T[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStrategyBrief(raw: Record<string, unknown>): WorkflowStrategyBrief {
  return {
    objective: String(raw.objective ?? ""),
    targetAudience: String(raw.targetAudience ?? raw.target_audience ?? ""),
    positioning: String(raw.positioning ?? ""),
    keyMessage: String(raw.keyMessage ?? raw.key_message ?? ""),
    recommendedChannels: parseJsonField(raw.recommendedChannels as string ?? raw.recommended_channels as string ?? "[]"),
    contentAngles: parseJsonField(raw.contentAngles as string ?? raw.content_angles as string ?? "[]"),
    ctaDirection: String(raw.ctaDirection ?? raw.cta_direction ?? ""),
    requiredAssets: parseJsonField(raw.requiredAssets as string ?? raw.required_assets as string ?? "[]"),
    missingContextWarnings: parseJsonField(raw.missingContextWarnings as string ?? raw.missing_context_warnings as string ?? "[]"),
    risksSafetyNotes: parseJsonField(raw.risksSafetyNotes as string ?? raw.risks_safety_notes as string ?? "[]"),
  };
}

function normalizeCreativeBrief(raw: Record<string, unknown>): WorkflowCreativeBrief {
  return {
    coreMessage: String(raw.coreMessage ?? raw.core_message ?? ""),
    audience: String(raw.audience ?? ""),
    tone: String(raw.tone ?? ""),
    textDirection: String(raw.textDirection ?? raw.text_direction ?? ""),
    visualDirection: String(raw.visualDirection ?? raw.visual_direction ?? ""),
    videoDirection: String(raw.videoDirection ?? raw.video_direction ?? ""),
    channelAdaptations: parseJsonField(raw.channelAdaptations as string ?? raw.channel_adaptations as string ?? "[]"),
    usageRightsReminders: parseJsonField(raw.usageRightsReminders as string ?? raw.usage_rights_reminders as string ?? "[]"),
    prohibitedElements: parseJsonField(raw.prohibitedElements as string ?? raw.prohibited_elements as string ?? "[]"),
  };
}

function normalizeImagePromptSpecs(raw: Record<string, unknown>): WorkflowImagePromptSpecs {
  return {
    imagePrompts: parseJsonField(raw.imagePrompts as string ?? raw.image_prompts as string ?? "[]"),
    compositionNotes: String(raw.compositionNotes ?? raw.composition_notes ?? ""),
    styleDirection: String(raw.styleDirection ?? raw.style_direction ?? ""),
    productSceneNotes: String(raw.productSceneNotes ?? raw.product_scene_notes ?? ""),
    channelFormatNotes: parseJsonField(raw.channelFormatNotes as string ?? raw.channel_format_notes as string ?? "[]"),
    usageRightsReminders: parseJsonField(raw.usageRightsReminders as string ?? raw.usage_rights_reminders as string ?? "[]"),
  };
}

function normalizeVideoScriptSpecs(raw: Record<string, unknown>): WorkflowVideoScriptSpecs {
  return {
    videoConcept: String(raw.videoConcept ?? raw.video_concept ?? ""),
    shortScript: String(raw.shortScript ?? raw.short_script ?? ""),
    storyboardOutline: String(raw.storyboardOutline ?? raw.storyboard_outline ?? ""),
    sceneList: parseJsonField(raw.sceneList as string ?? raw.scene_list as string ?? "[]"),
    voiceoverDraft: String(raw.voiceoverDraft ?? raw.voiceover_draft ?? ""),
    captionDraft: String(raw.captionDraft ?? raw.caption_draft ?? ""),
    platformAspectRatioNotes: parseJsonField(raw.platformAspectRatioNotes as string ?? raw.platform_aspect_ratio_notes as string ?? "[]"),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DraftBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      Draft only — requires human review before use. Do not approve or publish directly from AI output.
    </div>
  );
}

function SectionList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">None returned.</p>;
  return (
    <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CollapseCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function UnavailableBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-400">
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
  );
}

// ── Step 1: Client Intake ─────────────────────────────────────────────────────

function IntakeStep({
  workspaceId,
  campaignId,
  isViewer,
  onSaved,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<WorkflowIntake>({
    businessDescription: "",
    campaignObjective: "",
    targetAudience: "",
    offerValueProposition: "",
    brandTone: "",
    landingUrl: "",
    constraintsForbiddenClaims: "",
    availableCreativeAssets: "",
    missingInformation: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    wfFetch(`/api/campaign-workflow/intake?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        setForm({
          businessDescription: String(b.businessDescription ?? b.business_description ?? ""),
          campaignObjective: String(b.campaignObjective ?? b.campaign_objective ?? ""),
          targetAudience: String(b.targetAudience ?? b.target_audience ?? ""),
          offerValueProposition: String(b.offerValueProposition ?? b.offer_value_proposition ?? ""),
          brandTone: String(b.brandTone ?? b.brand_tone ?? ""),
          landingUrl: String(b.landingUrl ?? b.landing_url ?? ""),
          constraintsForbiddenClaims: String(b.constraintsForbiddenClaims ?? b.constraints_forbidden_claims ?? ""),
          availableCreativeAssets: String(b.availableCreativeAssets ?? b.available_creative_assets ?? ""),
          missingInformation: String(b.missingInformation ?? b.missing_information ?? ""),
        });
        setSaved(true);
      }
    });
  }

  const handleSave = async () => {
    if (isViewer) return;
    setLoading(true);
    setError(null);
    const { ok, body } = await wfFetch("/api/campaign-workflow/intake", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId, ...form }),
    });
    setLoading(false);
    if (ok) {
      setSaved(true);
      onSaved();
    } else {
      setError((body as { error?: string }).error ?? "Failed to save intake.");
    }
  };

  const set = (field: keyof WorkflowIntake) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            Step 1 — Client Intake
          </CardTitle>
          {saved && (
            <Badge variant="outline" className="text-green-700 border-green-500/30 bg-green-500/5">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Collect campaign context. This information feeds the strategy brief, creative brief, and text suggestions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business / Product Description</Label>
            <Textarea
              value={form.businessDescription}
              onChange={set("businessDescription")}
              placeholder="What does the business offer? What problem does it solve?"
              rows={2}
              className="resize-none"
              disabled={isViewer}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Campaign Objective</Label>
            <Input value={form.campaignObjective} onChange={set("campaignObjective")} placeholder="e.g. leads, sales, brand awareness" disabled={isViewer} />
          </div>
          <div className="space-y-1.5">
            <Label>Target Audience</Label>
            <Input value={form.targetAudience} onChange={set("targetAudience")} placeholder="e.g. 25–40 year old small business owners" disabled={isViewer} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Offer / Value Proposition</Label>
            <Input value={form.offerValueProposition} onChange={set("offerValueProposition")} placeholder="What specific offer or value is being communicated?" disabled={isViewer} />
          </div>
          <div className="space-y-1.5">
            <Label>Brand Tone</Label>
            <Input value={form.brandTone} onChange={set("brandTone")} placeholder="e.g. professional, bold, friendly" disabled={isViewer} />
          </div>
          <div className="space-y-1.5">
            <Label>Landing URL / Tracking Link</Label>
            <Input value={form.landingUrl} onChange={set("landingUrl")} placeholder="https://…" disabled={isViewer} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Constraints / Forbidden Claims</Label>
            <Textarea
              value={form.constraintsForbiddenClaims}
              onChange={set("constraintsForbiddenClaims")}
              placeholder="e.g. Do not mention competitors. Avoid claims like 'guaranteed results'."
              rows={2}
              className="resize-none"
              disabled={isViewer}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Available Creative Assets / References</Label>
            <Textarea
              value={form.availableCreativeAssets}
              onChange={set("availableCreativeAssets")}
              placeholder="e.g. product photos, brand guidelines URL, previous campaign references"
              rows={2}
              className="resize-none"
              disabled={isViewer}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Missing Information</Label>
            <Textarea
              value={form.missingInformation}
              onChange={set("missingInformation")}
              placeholder="What context is not yet available for this campaign?"
              rows={2}
              className="resize-none"
              disabled={isViewer}
            />
          </div>
        </div>
        {!isViewer && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="sm">
              {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Intake"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 2: Strategy Brief ────────────────────────────────────────────────────

function StrategyBriefStep({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [brief, setBrief] = useState<WorkflowStrategyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    wfFetch(`/api/campaign-workflow/strategy-brief?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setBrief(normalizeStrategyBrief(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
  }

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    const { ok, status: httpStatus, body } = await wfFetch("/api/campaign-workflow/strategy-brief", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    if (httpStatus === 503) {
      setStatus("unavailable");
      if ((body as { draft?: unknown }).draft) {
        setBrief(normalizeStrategyBrief((body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (ok && body && typeof body === "object") {
      setBrief(normalizeStrategyBrief(body as Record<string, unknown>));
      setStatus("ready");
      onGenerated();
    } else {
      setStatus("error");
      setErrMsg((body as { error?: string }).error ?? "Failed to generate strategy brief.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Step 2 — Strategy Brief
          </CardTitle>
          <Button onClick={handleGenerate} disabled={loading || isViewer} size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</> : brief ? "Regenerate" : "Generate Strategy Brief"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-generated campaign strategy draft. Save intake first for best results.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "unavailable" && <UnavailableBanner message="AI is unavailable until OPENAI_API_KEY is configured. Draft output shown below if available." />}
        {status === "error" && errMsg && <ErrorBanner message={errMsg} />}
        {brief ? (
          <>
            <DraftBanner />
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Objective", brief.objective],
                ["Target Audience", brief.targetAudience],
                ["Positioning", brief.positioning],
                ["Key Message", brief.keyMessage],
                ["CTA Direction", brief.ctaDirection],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                  <p>{value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <CollapseCard title="Recommended Channels" icon={Target}>
                <SectionList items={brief.recommendedChannels} />
              </CollapseCard>
              <CollapseCard title="Content Angles" icon={FileText}>
                <SectionList items={brief.contentAngles} />
              </CollapseCard>
              <CollapseCard title="Required Assets" icon={ClipboardList}>
                <SectionList items={brief.requiredAssets} />
              </CollapseCard>
              {brief.missingContextWarnings.length > 0 && (
                <CollapseCard title="Missing Context Warnings" icon={AlertTriangle}>
                  <SectionList items={brief.missingContextWarnings} />
                </CollapseCard>
              )}
              <CollapseCard title="Risks / Safety Notes" icon={AlertTriangle}>
                <SectionList items={brief.risksSafetyNotes} />
              </CollapseCard>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate a strategy brief to see objective, positioning, key message, content angles, and safety notes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 3: Creative Brief ────────────────────────────────────────────────────

function CreativeBriefStep({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [brief, setBrief] = useState<WorkflowCreativeBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    wfFetch(`/api/campaign-workflow/creative-brief?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setBrief(normalizeCreativeBrief(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
  }

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    const { ok, status: httpStatus, body } = await wfFetch("/api/campaign-workflow/creative-brief", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    if (httpStatus === 503) {
      setStatus("unavailable");
      if ((body as { draft?: unknown }).draft) {
        setBrief(normalizeCreativeBrief((body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (ok && body && typeof body === "object") {
      setBrief(normalizeCreativeBrief(body as Record<string, unknown>));
      setStatus("ready");
      onGenerated();
    } else {
      setStatus("error");
      setErrMsg((body as { error?: string }).error ?? "Failed to generate creative brief.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PenTool className="h-4 w-4" />
            Step 3 — Creative Brief
          </CardTitle>
          <Button onClick={handleGenerate} disabled={loading || isViewer} size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</> : brief ? "Regenerate" : "Generate Creative Brief"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Draft creative direction. Generate Strategy Brief first for best results.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "unavailable" && <UnavailableBanner message="AI is unavailable until OPENAI_API_KEY is configured. Draft output shown below if available." />}
        {status === "error" && errMsg && <ErrorBanner message={errMsg} />}
        {brief ? (
          <>
            <DraftBanner />
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Core Message", brief.coreMessage],
                ["Audience", brief.audience],
                ["Tone", brief.tone],
                ["Text Direction", brief.textDirection],
                ["Visual Direction", brief.visualDirection],
                ["Video Direction", brief.videoDirection],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                  <p>{value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <CollapseCard title="Channel Adaptations" icon={Target}>
                <SectionList items={brief.channelAdaptations} />
              </CollapseCard>
              <CollapseCard title="Usage Rights Reminders" icon={AlertTriangle}>
                <SectionList items={brief.usageRightsReminders} />
              </CollapseCard>
              <CollapseCard title="Prohibited Elements" icon={AlertTriangle}>
                <SectionList items={brief.prohibitedElements} />
              </CollapseCard>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate a creative brief to see core message, tone, text/visual/video direction, and prohibited elements.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 4: Text Suggestions (wrapper around existing AI Assist) ───────────────

type AITextAssistOutput = {
  hooks: string[];
  adCopyVariants: string[];
  captions: string[];
  ctas: string[];
  improvementNotes: string[];
  missingContextWarnings: string[];
  safetyNotes: string[];
};

function TextSuggestionsStep({
  workspaceId,
  campaignId,
  isViewer,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
}) {
  const [result, setResult] = useState<AITextAssistOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isViewer) {
      setStatus("error");
      setErrMsg("View-only access: ask an editor to generate AI suggestions.");
      return;
    }
    setLoading(true);
    setErrMsg(null);
    const { ok, body } = await wfFetch("/api/strategy/text-assist", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    const typedBody = body as { code?: string; output?: AITextAssistOutput; error?: string };
    if (typedBody.code === "AI_TEXT_UNAVAILABLE") {
      setStatus("unavailable");
      if (typedBody.output) setResult(typedBody.output);
      return;
    }
    if (ok && typedBody.output) {
      setStatus("ready");
      setResult(typedBody.output);
    } else {
      setStatus("error");
      setErrMsg(typedBody.error ?? "Failed to generate text suggestions.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Step 4 — Text Suggestions
          </CardTitle>
          <Button onClick={handleGenerate} disabled={loading || isViewer} size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</> : result ? "Regenerate" : "Generate Text Suggestions"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Draft hooks, ad copy, captions, and CTAs based on campaign context.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "unavailable" && <UnavailableBanner message="AI text suggestions unavailable until OPENAI_API_KEY is configured." />}
        {status === "error" && errMsg && <ErrorBanner message={errMsg} />}
        {result ? (
          <>
            <DraftBanner />
            <div className="grid gap-4 lg:grid-cols-2">
              {(
                [
                  ["Hooks", result.hooks],
                  ["Ad Copy Variants", result.adCopyVariants],
                  ["Captions", result.captions],
                  ["CTAs", result.ctas],
                  ["Improvement Notes", result.improvementNotes],
                  ["Missing Context", result.missingContextWarnings],
                  ["Safety Notes", result.safetyNotes],
                ] as [string, string[]][]
              ).map(([label, items]) => (
                <div key={label} className="rounded-lg border p-4">
                  <p className="font-medium mb-2 text-sm">{label}</p>
                  <SectionList items={items} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate text suggestions to get draft hooks, copy variants, captions, and CTAs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 5: Image Prompt Specs ────────────────────────────────────────────────

function ImagePromptSpecsStep({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [spec, setSpec] = useState<WorkflowImagePromptSpecs | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    wfFetch(`/api/campaign-workflow/image-prompt-specs?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setSpec(normalizeImagePromptSpecs(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
  }

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    const { ok, status: httpStatus, body } = await wfFetch("/api/campaign-workflow/image-prompt-specs", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    if (httpStatus === 503) {
      setStatus("unavailable");
      if ((body as { draft?: unknown }).draft) {
        setSpec(normalizeImagePromptSpecs((body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (ok && body && typeof body === "object") {
      setSpec(normalizeImagePromptSpecs(body as Record<string, unknown>));
      setStatus("ready");
      onGenerated();
    } else {
      setStatus("error");
      setErrMsg((body as { error?: string }).error ?? "Failed to generate image prompt specs.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4" />
            Step 5 — Image Prompt Specs
          </CardTitle>
          <Button onClick={handleGenerate} disabled={loading || isViewer} size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</> : spec ? "Regenerate" : "Generate Image Prompt Specs"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Prompt text and specs for future image production. No images are generated.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "unavailable" && <UnavailableBanner message="AI is unavailable until OPENAI_API_KEY is configured. Draft shown below if available." />}
        {status === "error" && errMsg && <ErrorBanner message={errMsg} />}
        {spec ? (
          <>
            <DraftBanner />
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              These are prompt specifications only. No images are generated or uploaded.
            </div>
            <div className="space-y-3">
              <CollapseCard title="Image Prompts" icon={Image} defaultOpen>
                <SectionList items={spec.imagePrompts} />
              </CollapseCard>
              <CollapseCard title="Composition Notes" icon={FileText}>
                <p className="text-sm text-muted-foreground">{spec.compositionNotes || "—"}</p>
              </CollapseCard>
              <CollapseCard title="Style Direction" icon={PenTool}>
                <p className="text-sm text-muted-foreground">{spec.styleDirection || "—"}</p>
              </CollapseCard>
              <CollapseCard title="Product / Scene Notes" icon={Target}>
                <p className="text-sm text-muted-foreground">{spec.productSceneNotes || "—"}</p>
              </CollapseCard>
              <CollapseCard title="Channel Format Notes" icon={Target}>
                <SectionList items={spec.channelFormatNotes} />
              </CollapseCard>
              <CollapseCard title="Usage Rights Reminders" icon={AlertTriangle}>
                <SectionList items={spec.usageRightsReminders} />
              </CollapseCard>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate image prompt specs to see prompt text, style direction, composition notes, and channel format requirements.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 6: Video Script / Storyboard Specs ───────────────────────────────────

function VideoScriptSpecsStep({
  workspaceId,
  campaignId,
  isViewer,
  onGenerated,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onGenerated: () => void;
}) {
  const [spec, setSpec] = useState<WorkflowVideoScriptSpecs | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "unavailable" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    wfFetch(`/api/campaign-workflow/video-script-specs?workspaceId=${workspaceId}&campaignId=${campaignId}`).then(({ ok, body }) => {
      if (ok && body && typeof body === "object") {
        setSpec(normalizeVideoScriptSpecs(body as Record<string, unknown>));
        setStatus("ready");
      }
    });
  }

  const handleGenerate = async () => {
    if (isViewer) return;
    setLoading(true);
    setErrMsg(null);
    const { ok, status: httpStatus, body } = await wfFetch("/api/campaign-workflow/video-script-specs", {
      method: "POST",
      body: JSON.stringify({ workspaceId, campaignId }),
    });
    setLoading(false);
    if (httpStatus === 503) {
      setStatus("unavailable");
      if ((body as { draft?: unknown }).draft) {
        setSpec(normalizeVideoScriptSpecs((body as { draft: Record<string, unknown> }).draft));
      }
      return;
    }
    if (ok && body && typeof body === "object") {
      setSpec(normalizeVideoScriptSpecs(body as Record<string, unknown>));
      setStatus("ready");
      onGenerated();
    } else {
      setStatus("error");
      setErrMsg((body as { error?: string }).error ?? "Failed to generate video script specs.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" />
            Step 6 — Video Script / Storyboard Specs
          </CardTitle>
          <Button onClick={handleGenerate} disabled={loading || isViewer} size="sm">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</> : spec ? "Regenerate" : "Generate Video Script Specs"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Draft video concept, script, and storyboard. No video is generated or uploaded.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "unavailable" && <UnavailableBanner message="AI is unavailable until OPENAI_API_KEY is configured. Draft shown below if available." />}
        {status === "error" && errMsg && <ErrorBanner message={errMsg} />}
        {spec ? (
          <>
            <DraftBanner />
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              These are script and storyboard specs only. No video is generated or uploaded.
            </div>
            <div className="space-y-3">
              <CollapseCard title="Video Concept" icon={Video} defaultOpen>
                <p className="text-sm text-muted-foreground">{spec.videoConcept || "—"}</p>
              </CollapseCard>
              <CollapseCard title="Short Script" icon={FileText}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{spec.shortScript || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="Storyboard Outline" icon={ClipboardList}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{spec.storyboardOutline || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="Scene List" icon={Target}>
                <SectionList items={spec.sceneList} />
              </CollapseCard>
              <CollapseCard title="Voiceover Draft" icon={FileText}>
                <p className="text-sm text-muted-foreground">{spec.voiceoverDraft || "—"}</p>
              </CollapseCard>
              <CollapseCard title="Caption Draft" icon={FileText}>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{spec.captionDraft || "—"}</pre>
              </CollapseCard>
              <CollapseCard title="Platform / Aspect Ratio Notes" icon={Target}>
                <SectionList items={spec.platformAspectRatioNotes} />
              </CollapseCard>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate video script specs to see concept, script, storyboard, voiceover draft, and platform notes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Status summary (for Campaign Completion panel) ───────────────────────────

export type WorkflowStepStatus = "not_started" | "saved" | "generated";

export interface WorkflowStatusSummary {
  intake: WorkflowStepStatus;
  strategyBrief: WorkflowStepStatus;
  creativeBrief: WorkflowStepStatus;
  textSuggestions: WorkflowStepStatus;
  imagePromptSpecs: WorkflowStepStatus;
  videoScriptSpecs: WorkflowStepStatus;
}

// ── Main exported component ───────────────────────────────────────────────────

export function CampaignWorkflowTab({
  workspaceId,
  campaignId,
  isViewer,
  onStatusChange,
}: {
  workspaceId: number;
  campaignId: number;
  isViewer: boolean;
  onStatusChange?: (status: WorkflowStatusSummary) => void;
}) {
  const [status, setStatus] = useState<WorkflowStatusSummary>({
    intake: "not_started",
    strategyBrief: "not_started",
    creativeBrief: "not_started",
    textSuggestions: "not_started",
    imagePromptSpecs: "not_started",
    videoScriptSpecs: "not_started",
  });

  const updateStatus = useCallback((field: keyof WorkflowStatusSummary, value: WorkflowStepStatus) => {
    setStatus((prev) => {
      const next = { ...prev, [field]: value };
      onStatusChange?.(next);
      return next;
    });
  }, [onStatusChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border bg-muted/20 px-4 py-2.5">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-medium text-foreground">AI Workflow Foundation.</span>{" "}
          All AI outputs are draft-only and require human review. No content is auto-approved, published, or committed.
          {isViewer && " Viewer access — generation is disabled."}
        </span>
      </div>

      <IntakeStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
        onSaved={() => updateStatus("intake", "saved")}
      />

      <StrategyBriefStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
        onGenerated={() => updateStatus("strategyBrief", "generated")}
      />

      <CreativeBriefStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
        onGenerated={() => updateStatus("creativeBrief", "generated")}
      />

      <TextSuggestionsStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
      />

      <ImagePromptSpecsStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
        onGenerated={() => updateStatus("imagePromptSpecs", "generated")}
      />

      <VideoScriptSpecsStep
        workspaceId={workspaceId}
        campaignId={campaignId}
        isViewer={isViewer}
        onGenerated={() => updateStatus("videoScriptSpecs", "generated")}
      />
    </div>
  );
}

export function WorkflowStatusPanel({ status }: { status: WorkflowStatusSummary }) {
  const steps: [string, keyof WorkflowStatusSummary][] = [
    ["Client Intake", "intake"],
    ["Strategy Brief", "strategyBrief"],
    ["Creative Brief", "creativeBrief"],
    ["Text Suggestions", "textSuggestions"],
    ["Image Prompt Specs", "imagePromptSpecs"],
    ["Video Script Specs", "videoScriptSpecs"],
  ];

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-sm font-medium">AI Workflow Status</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {steps.map(([label, key]) => {
          const s = status[key];
          return (
            <div key={key} className="flex items-center justify-between text-xs rounded-md border bg-background px-3 py-2">
              <span>{label}</span>
              <span
                className={
                  s === "generated"
                    ? "text-green-600"
                    : s === "saved"
                      ? "text-blue-600"
                      : "text-muted-foreground"
                }
              >
                {s === "generated" ? "Generated" : s === "saved" ? "Saved" : "Not started"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkflowSkeletonLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
