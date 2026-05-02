import { Router } from "express";
import { db } from "@workspace/db";
import { workspaceMembersTable, usersTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireWorkspaceRole, actor } from "../middleware/auth";

const router = Router();

router.get("/workspaces/:workspaceId/members", requireAuth, async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId);
  const [self] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, req.session.userId!)));
  if (!self) return res.status(403).json({ error: "Access denied" });

  const members = await db
    .select({
      id: workspaceMembersTable.id, userId: workspaceMembersTable.userId,
      role: workspaceMembersTable.role, email: usersTable.email, name: usersTable.name,
      createdAt: workspaceMembersTable.createdAt,
    })
    .from(workspaceMembersTable)
    .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(eq(workspaceMembersTable.workspaceId, workspaceId));

  res.json(members.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/workspaces/:workspaceId/members", requireAuth, requireWorkspaceRole("admin"), async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId);
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role are required" });
  const VALID_ROLES = ["admin", "editor", "viewer"];
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) return res.status(404).json({ error: "No user found with that email address" });

  const [existing] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, user.id)));
  if (existing) return res.status(409).json({ error: "User is already a member of this workspace" });

  const [member] = await db.insert(workspaceMembersTable).values({ workspaceId, userId: user.id, role }).returning();
  await db.insert(auditLogsTable).values({ workspaceId, action: "member_added", entityType: "workspace", entityId: workspaceId, actor: actor(req), details: `${email} added as ${role}` });
  res.status(201).json({ id: member.id, userId: user.id, email: user.email, name: user.name, role: member.role });
});

router.patch("/workspaces/:workspaceId/members/:userId", requireAuth, requireWorkspaceRole("admin"), async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId);
  const targetUserId = parseInt(req.params.userId);
  const { role } = req.body;
  const VALID_ROLES = ["admin", "editor", "viewer"];
  if (!role || !VALID_ROLES.includes(role)) return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });

  const [target] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, targetUserId)));
  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.role === "owner") return res.status(403).json({ error: "Cannot change the owner's role" });

  const [updated] = await db.update(workspaceMembersTable).set({ role })
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, targetUserId)))
    .returning();
  res.json({ id: updated.id, userId: updated.userId, role: updated.role });
});

router.delete("/workspaces/:workspaceId/members/:userId", requireAuth, requireWorkspaceRole("admin"), async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId);
  const targetUserId = parseInt(req.params.userId);

  const [target] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, targetUserId)));
  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.role === "owner") return res.status(403).json({ error: "Cannot remove the workspace owner" });

  await db.delete(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, targetUserId)));
  res.status(204).send();
});

export default router;
