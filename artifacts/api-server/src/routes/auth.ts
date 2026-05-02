import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, workspaceMembersTable, workspacesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  if (password.length < PASSWORD_MIN) {
    res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters` });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
  }).returning();

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;

  res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const memberships = await db
    .select({ workspaceId: workspaceMembersTable.workspaceId, role: workspaceMembersTable.role })
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.userId, user.id));

  const activeWorkspaceId = memberships[0]?.workspaceId ?? null;
  const activeRole = memberships[0]?.role ?? null;

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  if (activeWorkspaceId) {
    req.session.activeWorkspaceId = activeWorkspaceId;
    req.session.role = activeRole ?? undefined;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    activeWorkspaceId,
    role: activeRole,
    workspaces: memberships,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) { res.status(500).json({ error: "Logout failed" }); return; }
    res.clearCookie("mos.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  const memberships = await db
    .select({
      workspaceId: workspaceMembersTable.workspaceId,
      role: workspaceMembersTable.role,
      workspaceName: workspacesTable.name,
    })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, user.id));

  const activeWorkspaceId = req.session.activeWorkspaceId ?? memberships[0]?.workspaceId ?? null;
  const activeRole = memberships.find(m => m.workspaceId === activeWorkspaceId)?.role ?? null;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    activeWorkspaceId,
    role: activeRole,
    workspaces: memberships,
  });
});

router.post("/auth/switch-workspace", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { workspaceId } = req.body;
  if (!workspaceId) { res.status(400).json({ error: "workspaceId required" }); return; }

  const [member] = await db
    .select()
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, Number(workspaceId)),
        eq(workspaceMembersTable.userId, req.session.userId),
      ),
    );

  if (!member) {
    res.status(403).json({ error: "Access denied to this workspace" });
    return;
  }

  req.session.activeWorkspaceId = member.workspaceId;
  req.session.role = member.role;
  res.json({ activeWorkspaceId: member.workspaceId, role: member.role });
});

export default router;
