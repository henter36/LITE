import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { requireAuth, requireWorkspaceAccess, requireWorkspaceRole, actor } from "../middleware/auth";
import {
  getMetaProvider,
  dateRangeLast30Days,
  assertNoForbiddenOp,
  type MetaSyncResult,
} from "../lib/meta-provider";

const router = Router();

function rejectWriteOps(req: any, res: any): boolean {
  const forbidden = [
    "createCampaign", "editCampaign", "changeBudget",
    "publishAd", "pauseCampaign", "connectPaymentMethod",
  ];
  for (const op of forbidden) {
    if (req.body?.[op]) {
      res.status(403).json({ error: `Forbidden Meta operation: "${op}". Marketing OS Lite is read-only.` });
      return true;
    }
  }
  return false;
}

router.get("/meta/status", requireAuth, requireWorkspaceAccess, async (req, res): Promise<void> => {
  const { mode, credentialsConfigured, fallbackUsed } = getMetaProvider();
  res.json({ provider: mode, credentialsConfigured, fallbackUsed });
});

router.get("/meta/accounts", requireAuth, requireWorkspaceAccess, async (req, res): Promise<void> => {
  const { provider, mode, fallbackUsed } = getMetaProvider();
  try {
    const accounts = await provider.listAdAccounts();
    req.log.info({ meta: { mode, fallbackUsed, accountCount: accounts.length } }, "Meta accounts listed");
    res.json(accounts);
  } catch (err) {
    req.log.error({ err }, "Meta listAdAccounts failed — falling back to mock");
    const { provider: mock } = getMetaProvider();
    const accounts = await mock.listAdAccounts();
    res.json(accounts.map((a) => ({ ...a, source: "mock" as const })));
  }
});

router.post("/meta/sync", requireAuth, requireWorkspaceRole("editor"), async (req, res): Promise<void> => {
  if (rejectWriteOps(req, res)) return;
  assertNoForbiddenOp("sync_trigger");

  const workspaceId = Number(req.body?.workspaceId);
  if (!workspaceId || isNaN(workspaceId)) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }

  const { provider, mode, fallbackUsed } = getMetaProvider();
  const { since, until } = dateRangeLast30Days();
  const syncedAt = new Date().toISOString();

  await db.insert(auditLogsTable).values({
    workspaceId,
    action: "meta_readonly_sync_started",
    entityType: "meta_sync",
    entityId: null,
    actor: actor(req),
    details: `Meta read-only sync started — provider: ${mode}, fallback: ${fallbackUsed}, dateRange: ${since}→${until}`,
  });

  req.log.info({ workspaceId, mode, fallbackUsed }, "meta_readonly_sync_started");

  try {
    const adAccounts = await provider.listAdAccounts();

    const campaignsPerAccount = await Promise.all(
      adAccounts.map((a) => provider.listCampaigns(a.id))
    );
    const campaigns = campaignsPerAccount.flat();

    const metricsPerAccount = await Promise.all(
      adAccounts.map((a) => provider.fetchMetrics(a.id, since, until))
    );

    const result: MetaSyncResult = {
      adAccounts,
      campaigns,
      metrics: metricsPerAccount,
      provider: mode,
      fallbackUsed,
      syncedAt,
    };

    await db.insert(auditLogsTable).values({
      workspaceId,
      action: "meta_readonly_sync_completed",
      entityType: "meta_sync",
      entityId: null,
      actor: actor(req),
      details: `Meta read-only sync completed — provider: ${mode}${fallbackUsed ? " [fallback: mock used]" : ""}, accounts: ${adAccounts.length} [${adAccounts.map((a) => a.id).join(", ")}], campaigns: ${campaigns.length}, workspaceId: ${workspaceId}`,
    });

    req.log.info(
      { workspaceId, mode, fallbackUsed, accounts: adAccounts.length, accountIds: adAccounts.map((a) => a.id), campaigns: campaigns.length },
      "meta_readonly_sync_completed"
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err, workspaceId, mode }, "meta_readonly_sync_failed");

    await db.insert(auditLogsTable).values({
      workspaceId,
      action: "meta_readonly_sync_failed",
      entityType: "meta_sync",
      entityId: null,
      actor: actor(req),
      details: `Meta read-only sync failed — provider: ${mode}, error: ${err instanceof Error ? err.message : String(err)}, workspaceId: ${workspaceId}`,
    });

    res.status(502).json({ error: "Meta sync failed. Check credentials or try again." });
  }
});

export default router;
