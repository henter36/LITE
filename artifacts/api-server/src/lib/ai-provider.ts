import OpenAI from "openai";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignBrief {
  name: string;
  objective: string;
  productService: string;
  audience: string;
  geography: string;
}

export interface BrandContext {
  brandName: string;
  toneOfVoice: string;
  targetAudience: string;
  forbiddenClaims: string;
  preferredChannels: string[];
  visualNotes: string;
}

export interface GenerationInput {
  campaign: CampaignBrief;
  brand?: BrandContext;
}

export interface GenerationOutput {
  headline: string;
  shortCaption: string;
  longCaption: string;
  cta: string;
  hashtags: string[];
  videoScript: string;
  storyboardOutline: string;
}

export interface GenerationMetadata {
  provider: "mock" | "openai";
  model: string;
  promptVersion: string;
  fallbackUsed: boolean;
  generatedAt: string;
}

export interface GenerationResult {
  output: GenerationOutput;
  metadata: GenerationMetadata;
}

export interface TextAssistInput {
  campaign: CampaignBrief & {
    id: number;
    selectedChannels: string[];
    strategySummary?: string;
    completionContext?: {
      hasApprovedAd: boolean;
      isReady: boolean;
      hasApprovedCreativeAsset: boolean;
      hasUsageRightsNotes: boolean;
      hasTrackingLink: boolean;
      hasSelectedChannels: boolean;
    };
  };
  brand?: BrandContext;
  existingDrafts?: {
    hooks?: string[];
    adCopyVariants?: string[];
    captions?: string[];
    ctas?: string[];
  };
}

export interface TextAssistOutput {
  hooks: string[];
  adCopyVariants: string[];
  captions: string[];
  ctas: string[];
  improvementNotes: string[];
  missingContextWarnings: string[];
  safetyNotes: string[];
}

export interface TextAssistResult {
  output: TextAssistOutput;
  metadata: GenerationMetadata;
}

export interface AIProvider {
  generate(input: GenerationInput): Promise<GenerationResult>;
}

export interface AITextAssistProvider {
  generateText(input: TextAssistInput): Promise<TextAssistResult>;
}

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

const PROMPT_VERSION = "v1.0";

const HARD_BANNED_PHRASES = [
  "guaranteed sales",
  "100% guaranteed",
  "guaranteed results",
  "instant results guaranteed",
  "risk-free profits",
  "proven to double",
  "proven to triple",
  "overnight success",
  "get rich",
  "make money fast",
  "no effort required",
  "results guaranteed",
  "money-back guaranteed",
  "financial freedom guaranteed",
];

export function filterForbiddenClaims(text: string, forbiddenClaims: string): string {
  if (!forbiddenClaims.trim()) return text;
  const phrases = forbiddenClaims
    .split(/[\n.!?,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 3);
  let result = text;
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "[filtered]");
    } catch {
      // Skip malformed patterns
    }
  }
  return result;
}

function filterHardBanned(text: string): string {
  let result = text;
  for (const phrase of HARD_BANNED_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "[filtered]");
    } catch {
      // Skip
    }
  }
  return result;
}

function applyAllGuardrails(text: string, forbiddenClaims?: string): string {
  let out = filterHardBanned(text);
  if (forbiddenClaims) out = filterForbiddenClaims(out, forbiddenClaims);
  return out;
}

function applyGuardrailsToOutput(output: GenerationOutput, forbiddenClaims?: string): GenerationOutput {
  const filter = (t: string) => applyAllGuardrails(t, forbiddenClaims);
  return {
    headline: filter(output.headline),
    shortCaption: filter(output.shortCaption),
    longCaption: filter(output.longCaption),
    cta: filter(output.cta),
    hashtags: output.hashtags.map(filter),
    videoScript: filter(output.videoScript),
    storyboardOutline: filter(output.storyboardOutline),
  };
}

function applyGuardrailsToTextAssistOutput(output: TextAssistOutput, forbiddenClaims?: string): TextAssistOutput {
  const filter = (t: string) => applyAllGuardrails(t, forbiddenClaims);
  return {
    hooks: output.hooks.map(filter),
    adCopyVariants: output.adCopyVariants.map(filter),
    captions: output.captions.map(filter),
    ctas: output.ctas.map(filter),
    improvementNotes: output.improvementNotes.map(filter),
    missingContextWarnings: output.missingContextWarnings.map(filter),
    safetyNotes: output.safetyNotes.map(filter),
  };
}

// ---------------------------------------------------------------------------
// Mock provider (always available, no external dependency)
// ---------------------------------------------------------------------------

const MOCK_HEADLINES = [
  "Discover the Difference",
  "Transform Your Experience",
  "Unleash Your Potential",
  "Built for the Bold",
  "The Future Is Here",
];
const MOCK_CTAS = ["Shop Now", "Learn More", "Get Started", "Try Free", "Explore Today"];
const MOCK_HASHTAGS = [
  ["#marketing", "#business", "#growth", "#digital", "#success"],
  ["#brand", "#strategy", "#social", "#campaign", "#results"],
  ["#startup", "#entrepreneur", "#innovation", "#sales", "#leads"],
];
const TONE_OPENERS: Record<string, string> = {
  professional: "Trusted by professionals,",
  casual: "Here's something made for you:",
  bold: "No fluff. Just results.",
  friendly: "We built this for people like you.",
  energetic: "Ready to level up?",
  authoritative: "The data is clear:",
  playful: "Psst — you're going to love this.",
  inspirational: "What if things could be different?",
  witty: "Clever campaigns deserve clever tools.",
  empathetic: "We understand what you're working toward.",
};

export class MockAIProvider implements AIProvider {
  async generate(input: GenerationInput): Promise<GenerationResult> {
    const { campaign, brand } = input;
    const hIdx = Math.floor(Math.random() * MOCK_HEADLINES.length);
    const cIdx = Math.floor(Math.random() * MOCK_CTAS.length);
    const tagIdx = Math.floor(Math.random() * MOCK_HASHTAGS.length);

    const cta = MOCK_CTAS[cIdx];
    const hashtags = MOCK_HASHTAGS[tagIdx];
    const headline = brand?.brandName
      ? `${brand.brandName} — ${MOCK_HEADLINES[hIdx]}`
      : `${MOCK_HEADLINES[hIdx]}: ${campaign.productService}`;

    const toneKey = brand?.toneOfVoice?.toLowerCase().trim() ?? "";
    const toneOpener = TONE_OPENERS[toneKey] ?? "";
    const shortCaption = toneOpener
      ? `${toneOpener} ${campaign.productService} was made for ${campaign.audience}. Your ${campaign.objective} journey starts now.`
      : `Reaching ${campaign.audience} with ${campaign.productService}. Your ${campaign.objective} starts here.`;

    const longCaption = brand?.brandName
      ? `${brand.brandName} is proud to introduce ${campaign.productService} — designed specifically for ${campaign.audience}. Whether you're focused on ${campaign.objective}, this is the solution built for your goals. Explore what's possible and see measurable results. ${cta} and experience the ${brand.brandName} difference.`
      : `Introducing ${campaign.productService} — designed specifically for ${campaign.audience}. Whether you're focused on ${campaign.objective}, this is the solution built for your goals. Explore what's possible and see measurable results with a focused strategy. ${cta} and experience the difference yourself.`;

    const videoScript = `[SCENE 1 - Hook]\nOpen on a relatable challenge your audience faces.\n\n[SCENE 2 - Solution]\nIntroduce ${campaign.productService} as the answer.\n\n[SCENE 3 - Benefits]\nHighlight 3 key benefits for ${campaign.audience}.\n\n[SCENE 4 - CTA]\n${cta}! Visit our website or swipe up to learn more.`;

    const visualSection = brand?.visualNotes ? `\n\nVisual direction: ${brand.visualNotes}` : "";
    const storyboardOutline = `Frame 1: Attention-grabbing hook visual\nFrame 2: Problem statement text overlay\nFrame 3: Product/service showcase\nFrame 4: Demonstrated outcome\nFrame 5: CTA screen with ${brand?.brandName ? `${brand.brandName} ` : ""}logo and URL${visualSection}`;

    const raw: GenerationOutput = { headline, shortCaption, longCaption, cta, hashtags, videoScript, storyboardOutline };
    const output = applyGuardrailsToOutput(raw, brand?.forbiddenClaims);

    return {
      output,
      metadata: {
        provider: "mock",
        model: "mock-v1",
        promptVersion: PROMPT_VERSION,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildSystemPrompt(brand?: BrandContext): string {
  const forbiddenSection = brand?.forbiddenClaims?.trim()
    ? `\nFORBIDDEN CLAIMS (never include these or any paraphrase of them):\n${brand.forbiddenClaims}\n`
    : "";

  return `You are a brand-safe marketing copywriter${brand?.brandName ? ` for ${brand.brandName}` : ""}.
${brand?.toneOfVoice ? `Tone of voice: ${brand.toneOfVoice}.` : ""}
${brand?.targetAudience ? `Target audience: ${brand.targetAudience}.` : ""}
${brand?.visualNotes ? `Visual direction: ${brand.visualNotes}.` : ""}
${forbiddenSection}
HARD RULES — never violate:
1. Never make unsupported performance promises: do not use phrases like "guaranteed sales", "100% guaranteed results", "instant ROI guaranteed", "risk-free profits", "proven to double revenue", or any similar claim.
2. Never fabricate statistics, testimonials, or social proof.
3. Do not reference real competitors by name or make comparative superiority claims.
4. All content is a draft for human review — never imply it is approved or final.
5. Content must comply with major advertising platform policies (Meta, Google, TikTok, Snapchat).

You MUST respond with ONLY valid JSON — no markdown fences, no explanations, no extra keys — matching this exact shape:
{
  "headline": "string, 8-12 words, attention-grabbing",
  "shortCaption": "string, 1-2 punchy sentences",
  "longCaption": "string, 3-5 descriptive sentences",
  "cta": "string, 2-4 action words",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "videoScript": "string, 4-scene script with [SCENE N - Label] headings",
  "storyboardOutline": "string, 5 visual frames"
}`;
}

function buildUserMessage(input: GenerationInput): string {
  const { campaign, brand } = input;
  return `Generate marketing content for this campaign:
- Name: ${campaign.name}
- Objective: ${campaign.objective}
- Product/service: ${campaign.productService}
- Target audience: ${campaign.audience}
- Geography: ${campaign.geography}
${brand ? `
Brand context:
- Brand name: ${brand.brandName}
- Tone of voice: ${brand.toneOfVoice}
- Preferred channels: ${brand.preferredChannels.join(", ") || "any"}` : ""}

Return ONLY the JSON object described in the system prompt.`;
}

function parseOpenAIResponse(raw: string): GenerationOutput {
  const parsed = JSON.parse(raw.trim());
  return {
    headline: String(parsed.headline ?? ""),
    shortCaption: String(parsed.shortCaption ?? ""),
    longCaption: String(parsed.longCaption ?? ""),
    cta: String(parsed.cta ?? ""),
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
    videoScript: String(parsed.videoScript ?? ""),
    storyboardOutline: String(parsed.storyboardOutline ?? ""),
  };
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: GenerationInput): Promise<GenerationResult> {
    const { brand } = input;

    const response = await this.client.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: "system", content: buildSystemPrompt(brand) },
        { role: "user", content: buildUserMessage(input) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = parseOpenAIResponse(raw);
    const output = applyGuardrailsToOutput(parsed, brand?.forbiddenClaims);

    return {
      output,
      metadata: {
        provider: "openai",
        model: response.model,
        promptVersion: PROMPT_VERSION,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

function parseTextAssistResponse(raw: string): TextAssistOutput {
  const parsed = JSON.parse(raw.trim());
  const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  return {
    hooks: list(parsed.hooks),
    adCopyVariants: list(parsed.adCopyVariants),
    captions: list(parsed.captions),
    ctas: list(parsed.ctas),
    improvementNotes: list(parsed.improvementNotes),
    missingContextWarnings: list(parsed.missingContextWarnings),
    safetyNotes: list(parsed.safetyNotes),
  };
}

export class OpenAITextAssistProvider implements AITextAssistProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(input: TextAssistInput): Promise<TextAssistResult> {
    const { campaign, brand, existingDrafts } = input;
    const response = await this.client.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a safe marketing copy assistant. Return ONLY valid JSON with keys hooks, adCopyVariants, captions, ctas, improvementNotes, missingContextWarnings, and safetyNotes. Draft only. Never approve, publish, or change readiness.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            campaign,
            brand,
            existingDrafts,
          }),
        },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const output = applyGuardrailsToTextAssistOutput(parseTextAssistResponse(raw), brand?.forbiddenClaims);
    return {
      output,
      metadata: {
        provider: "openai",
        model: response.model,
        promptVersion: PROMPT_VERSION,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export class MockAITextAssistProvider implements AITextAssistProvider {
  async generateText(input: TextAssistInput): Promise<TextAssistResult> {
    const { campaign, brand, existingDrafts } = input;
    const tone = brand?.toneOfVoice?.trim() || "clear";
    const channels = campaign.selectedChannels.length > 0 ? campaign.selectedChannels.join(", ") : "selected channels";
    const summary = campaign.strategySummary || `${campaign.objective} for ${campaign.audience}`;
    const hooks = [
      `${campaign.name}: ${campaign.objective} made clearer`,
      `A smarter way to reach ${campaign.audience}`,
      `${campaign.productService} that supports ${campaign.objective}`,
    ];
    const adCopyVariants = [
      `Help ${campaign.audience} achieve ${campaign.objective} with ${campaign.productService}.`,
      `Built for ${campaign.audience} across ${channels}.`,
      `Use ${campaign.productService} to strengthen ${summary}.`,
    ];
    const captions = [
      `Draft only: ${campaign.productService} for ${campaign.audience}.`,
      `Tone: ${tone}. Keep the message focused and review before use.`,
    ];
    const ctas = ["Learn More", "Get Started", "View Details"];
    const improvementNotes = [
      campaign.completionContext?.hasApprovedCreativeAsset
        ? "Creative asset/reference is available."
        : "Add an approved creative asset/reference before manual publish.",
      campaign.completionContext?.hasTrackingLink
        ? "Tracking is in place."
        : "Add a tracking link or landing URL.",
      existingDrafts?.adCopyVariants?.length ? "Refine existing draft copy rather than replacing it." : "No draft copy found; start with a single clear angle.",
    ];
    const missingContextWarnings = [
      campaign.completionContext?.hasApprovedAd ? "" : "No approved ad exists yet.",
      campaign.completionContext?.isReady ? "" : "Campaign is not marked ready.",
    ].filter(Boolean);
    const safetyNotes = [
      "Draft only.",
      "Do not approve or publish from AI output.",
      "Manual review required.",
    ];
    return {
      output: applyGuardrailsToTextAssistOutput(
        {
          hooks,
          adCopyVariants,
          captions,
          ctas,
          improvementNotes,
          missingContextWarnings,
          safetyNotes,
        },
        brand?.forbiddenClaims,
      ),
      metadata: {
        provider: "mock",
        model: "mock-text-v1",
        promptVersion: PROMPT_VERSION,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Factory — reads env, selects provider, handles missing key gracefully
// ---------------------------------------------------------------------------

export function getAIProvider(): { provider: AIProvider; selectedProvider: "mock" | "openai"; keyMissing: boolean } {
  const requested = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (requested === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn("AI_PROVIDER=openai but OPENAI_API_KEY is not set — falling back to mock provider");
      return { provider: new MockAIProvider(), selectedProvider: "mock", keyMissing: true };
    }
    return { provider: new OpenAIProvider(apiKey), selectedProvider: "openai", keyMissing: false };
  }

  return { provider: new MockAIProvider(), selectedProvider: "mock", keyMissing: false };
}

export function getAITextAssistProvider(): { provider: AITextAssistProvider; selectedProvider: "mock" | "openai"; keyMissing: boolean } {
  const requested = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (requested === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn("AI_PROVIDER=openai but OPENAI_API_KEY is not set — falling back to mock text provider");
      return { provider: new MockAITextAssistProvider(), selectedProvider: "mock", keyMissing: true };
    }
    return { provider: new OpenAITextAssistProvider(apiKey), selectedProvider: "openai", keyMissing: false };
  }

  return { provider: new MockAITextAssistProvider(), selectedProvider: "mock", keyMissing: false };
}
