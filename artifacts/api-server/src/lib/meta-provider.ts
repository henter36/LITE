import { logger } from "./logger";

export type MetaSource = "mock" | "meta_readonly";

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  source: MetaSource;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  source: MetaSource;
}

export interface MetaMetricsSummary {
  accountId: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  dateRange: { since: string; until: string };
  source: MetaSource;
}

export interface MetaSyncResult {
  adAccounts: MetaAdAccount[];
  campaigns: MetaCampaign[];
  metrics: MetaMetricsSummary[];
  provider: "mock" | "meta_readonly";
  fallbackUsed: boolean;
  syncedAt: string;
}

export interface MetaProviderStatus {
  provider: "mock" | "meta_readonly";
  credentialsConfigured: boolean;
  fallbackUsed: boolean;
}

export interface MetaAdsProvider {
  listAdAccounts(): Promise<MetaAdAccount[]>;
  listCampaigns(accountId: string): Promise<MetaCampaign[]>;
  fetchMetrics(accountId: string, since: string, until: string): Promise<MetaMetricsSummary>;
}

const FORBIDDEN_META_OPS = [
  "createCampaign",
  "editCampaign",
  "changeBudget",
  "publishAd",
  "pauseCampaign",
  "connectPaymentMethod",
] as const;

export function assertNoForbiddenOp(op: string): void {
  if (FORBIDDEN_META_OPS.includes(op as (typeof FORBIDDEN_META_OPS)[number])) {
    throw new Error(`Forbidden Meta operation: "${op}". Marketing OS Lite is read-only.`);
  }
}

export class MockMetaAdsProvider implements MetaAdsProvider {
  async listAdAccounts(): Promise<MetaAdAccount[]> {
    return [
      { id: "mock_act_100000001", name: "Demo Ad Account — Bright & Bold", currency: "USD", source: "mock" },
      { id: "mock_act_100000002", name: "Demo Ad Account — Global Reach", currency: "USD", source: "mock" },
    ];
  }

  async listCampaigns(accountId: string): Promise<MetaCampaign[]> {
    return [
      { id: `mock_cmp_${accountId}_1`, name: "Brand Awareness Q3", status: "ACTIVE", objective: "BRAND_AWARENESS", source: "mock" },
      { id: `mock_cmp_${accountId}_2`, name: "Lead Gen — Summer Push", status: "ACTIVE", objective: "LEAD_GENERATION", source: "mock" },
      { id: `mock_cmp_${accountId}_3`, name: "Retargeting — Web Visitors", status: "PAUSED", objective: "CONVERSIONS", source: "mock" },
    ];
  }

  async fetchMetrics(accountId: string, since: string, until: string): Promise<MetaMetricsSummary> {
    const seed = accountId.charCodeAt(accountId.length - 1);
    return {
      accountId,
      spend: parseFloat((1200 + seed * 7.3).toFixed(2)),
      impressions: 48000 + seed * 210,
      clicks: 1820 + seed * 15,
      reach: 32000 + seed * 180,
      ctr: parseFloat((3.79 + seed * 0.04).toFixed(2)),
      dateRange: { since, until },
      source: "mock",
    };
  }
}

const GRAPH_API_VERSION = "v20.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class MetaReadOnlyProvider implements MetaAdsProvider {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${GRAPH_BASE}${path}`);
    url.searchParams.set("access_token", this.token);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Meta Graph API error (${res.status}): ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async listAdAccounts(): Promise<MetaAdAccount[]> {
    const data = await this.get<{ data: { id: string; name: string; currency: string }[] }>(
      "/me/adaccounts",
      { fields: "id,name,currency", limit: "25" }
    );
    return data.data.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      source: "meta_readonly" as const,
    }));
  }

  async listCampaigns(accountId: string): Promise<MetaCampaign[]> {
    const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
    const data = await this.get<{ data: { id: string; name: string; status: string; objective: string }[] }>(
      `/${actId}/campaigns`,
      { fields: "id,name,status,objective", limit: "50" }
    );
    return data.data.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      source: "meta_readonly" as const,
    }));
  }

  async fetchMetrics(accountId: string, since: string, until: string): Promise<MetaMetricsSummary> {
    const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
    const data = await this.get<{
      data: { spend: string; impressions: string; clicks: string; reach: string; ctr: string }[];
    }>(`/${actId}/insights`, {
      fields: "spend,impressions,clicks,reach,ctr",
      time_range: JSON.stringify({ since, until }),
      level: "account",
    });
    const row = data.data[0] ?? { spend: "0", impressions: "0", clicks: "0", reach: "0", ctr: "0" };
    return {
      accountId,
      spend: parseFloat(row.spend),
      impressions: parseInt(row.impressions, 10),
      clicks: parseInt(row.clicks, 10),
      reach: parseInt(row.reach, 10),
      ctr: parseFloat(row.ctr),
      dateRange: { since, until },
      source: "meta_readonly",
    };
  }
}

export interface MetaProviderResult {
  provider: MetaAdsProvider;
  mode: "mock" | "meta_readonly";
  credentialsConfigured: boolean;
  fallbackUsed: boolean;
}

export function getMetaProvider(): MetaProviderResult {
  const requested = (process.env.META_PROVIDER ?? "mock").toLowerCase();
  const token = process.env.META_ACCESS_TOKEN;

  if (requested === "real" || requested === "meta_readonly") {
    if (token) {
      logger.info({ metaProvider: "meta_readonly" }, "Meta provider: MetaReadOnlyProvider selected");
      return { provider: new MetaReadOnlyProvider(token), mode: "meta_readonly", credentialsConfigured: true, fallbackUsed: false };
    }
    logger.warn({ metaProvider: "mock", reason: "META_ACCESS_TOKEN missing" }, "Meta provider: falling back to mock — META_ACCESS_TOKEN not set");
    return { provider: new MockMetaAdsProvider(), mode: "mock", credentialsConfigured: false, fallbackUsed: true };
  }

  return { provider: new MockMetaAdsProvider(), mode: "mock", credentialsConfigured: false, fallbackUsed: false };
}

export function dateRangeLast30Days(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}
