import { Router } from "express";
import { db } from "@workspace/db";
import { platformConnectionsTable, syncJobsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireWorkspaceAccess, requireWorkspaceRole, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();

function rejectRealOps(req: any, res: any): boolean {
  if (req.body?.publishLive || req.body?.changeBudget || req.body?.connectPayment) {
    res.status(403).json({ error: "Real ad operations are disabled in Marketing OS Lite MVP. This is a mock integration only." });
    return true;
  }
  return false;
}

function serialize(c: typeof platformConnectionsTable.$inferSelect) {
  return {
    id: c.id, workspaceId: c.workspaceId, platform: c.platform, accountName: c.accountName,
    accountId: c.accountId, status: c.status, mockSpend: c.mockSpend, mockImpressions: c.mockImpressions,
    mockClicks: c.mockClicks, lastSyncAt: c.lastSyncAt?.toISOString() || null, createdAt: c.createdAt.toISOString(),
  };
}

router.get("/connections", requireAuth, requireWorkspaceAccess, async (req, res): Promise<void> => {
  const connections = req.query.workspaceId
    ? await db.select().from(platformConnectionsTable).where(eq(platformConnectionsTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(platformConnectionsTable);
  res.json(connections.map(serialize));
});

router.post("/connections", requireAuth, requireWorkspaceRole("admin"), async (req, res): Promise<void> => {
  if (rejectRealOps(req, res)) return;
  const { workspaceId, platform, accountName } = req.body;
  const mockAccountId = `mock_${platform}_${Date.now()}`;
  const mockSpend = Math.random() * 2000 + 200;
  const mockImpressions = Math.floor(Math.random() * 100000 + 5000);
  const mockClicks = Math.floor(mockImpressions * (Math.random() * 0.05 + 0.01));
  const [conn] = await db.insert(platformConnectionsTable).values({
    workspaceId, platform, accountName, accountId: mockAccountId,
    status: "connected", mockSpend, mockImpressions, mockClicks, lastSyncAt: new Date(),
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId, action: "mock_connection_created", entityType: "connection", entityId: conn.id, actor: actor(req), details: `Mock ${platform} account "${accountName}" connected` });
  res.status(201).json(serialize(conn));
});

router.delete("/connections/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [conn] = await db.select().from(platformConnectionsTable).where(eq(platformConnectionsTable.id, id));
  if (!conn) { res.status(404).json({ error: "Not found" }); return; }
  const role = await getMemberRole(req.session.userId!, conn.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  if (!hasMinRole(role, "admin")) { res.status(403).json({ error: "Requires admin role or above" }); return; }
  await db.delete(platformConnectionsTable).where(eq(platformConnectionsTable.id, id));
  res.status(204).send();
});

router.post("/connections/:id/sync", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [conn] = await db.select().from(platformConnectionsTable).where(eq(platformConnectionsTable.id, id));
  if (!conn) { res.status(404).json({ error: "Not found" }); return; }
  const role = await getMemberRole(req.session.userId!, conn.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  const newSpend = conn.mockSpend + Math.random() * 50;
  const newImpressions = conn.mockImpressions + Math.floor(Math.random() * 2000);
  const newClicks = conn.mockClicks + Math.floor(Math.random() * 100);
  await db.update(platformConnectionsTable).set({ mockSpend: newSpend, mockImpressions: newImpressions, mockClicks: newClicks, lastSyncAt: new Date() }).where(eq(platformConnectionsTable.id, id));
  const [job] = await db.insert(syncJobsTable).values({ connectionId: id, status: "completed", startedAt: new Date(), completedAt: new Date() }).returning();
  await db.insert(auditLogsTable).values({ workspaceId: conn.workspaceId, action: "mock_sync_executed", entityType: "connection", entityId: id, actor: actor(req), details: `Mock sync for ${conn.platform} account "${conn.accountName}"` });
  res.json({ id: job.id, connectionId: job.connectionId, status: job.status, startedAt: job.startedAt.toISOString(), completedAt: job.completedAt?.toISOString() || null });
});

export default router;
