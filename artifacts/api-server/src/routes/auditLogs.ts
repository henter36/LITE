import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireWorkspaceAccess } from "../middleware/auth";

const router = Router();

router.get("/audit-logs", requireAuth, requireWorkspaceAccess, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const conditions = [];
  if (req.query.workspaceId) conditions.push(eq(auditLogsTable.workspaceId, Number(req.query.workspaceId)));
  if (req.query.action) conditions.push(eq(auditLogsTable.action, String(req.query.action)));
  if (req.query.search) conditions.push(ilike(auditLogsTable.details, `%${req.query.search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable).where(whereClause);
  const items = whereClause
    ? await db.select().from(auditLogsTable).where(whereClause).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset)
    : await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset);

  res.json({
    items: items.map(l => ({ id: l.id, workspaceId: l.workspaceId, action: l.action, entityType: l.entityType, entityId: l.entityId, actor: l.actor, details: l.details, createdAt: l.createdAt.toISOString() })),
    total: Number(countResult.count), limit, offset,
  });
});

export default router;
