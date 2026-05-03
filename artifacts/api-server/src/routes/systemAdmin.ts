import { Router } from "express";
import { requireAuth, requireSystemAdmin, requireSuperAdmin, getSystemRole, actor } from "../middleware/auth";
import { auditLogsTable } from "@workspace/db";
import { db } from "@workspace/db";

const router = Router();

router.get("/system-admin/status", requireAuth, requireSystemAdmin, async (req, res): Promise<void> => {
  const platformRole = await getSystemRole(req.session.userId!);
  const body = {
    status: "ok",
    currentUser: {
      id: req.session.userId,
      email: req.session.email ?? null,
    },
    platformRole,
  };

  await db.insert(auditLogsTable).values({
    workspaceId: 0,
    action: "system_admin_status_read",
    entityType: "system_admin",
    entityId: null,
    actor: actor(req),
    details: `System admin status checked by user ${req.session.userId}`,
  });

  res.json(body);
});

router.get("/system-admin/super-status", requireAuth, requireSuperAdmin, async (req, res): Promise<void> => {
  const platformRole = await getSystemRole(req.session.userId!);
  res.json({
    status: "ok",
    currentUser: {
      id: req.session.userId,
      email: req.session.email ?? null,
    },
    platformRole,
    scope: "super_admin",
  });
});

export default router;
