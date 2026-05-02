import { Router } from "express";
import { db } from "@workspace/db";
import { workspacesTable, auditLogsTable, workspaceMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();

function serialize(w: typeof workspacesTable.$inferSelect) {
  return {
    id: w.id, name: w.name, businessType: w.businessType, country: w.country,
    language: w.language, defaultCurrency: w.defaultCurrency,
    createdAt: w.createdAt.toISOString(),
  };
}

router.get("/workspaces", requireAuth, async (req, res) => {
  const memberships = await db.select({ workspaceId: workspaceMembersTable.workspaceId })
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.userId, req.session.userId!));
  if (memberships.length === 0) return res.json([]);
  const ids = memberships.map(m => m.workspaceId);
  const all = await db.select().from(workspacesTable).orderBy(workspacesTable.createdAt);
  res.json(all.filter(w => ids.includes(w.id)).map(serialize));
});

router.post("/workspaces", requireAuth, async (req, res) => {
  const { name, businessType, country, language, defaultCurrency } = req.body;
  if (!name || !businessType || !country || !language || !defaultCurrency) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const [w] = await db.insert(workspacesTable).values({ name, businessType, country, language, defaultCurrency }).returning();
  await db.insert(workspaceMembersTable).values({ workspaceId: w.id, userId: req.session.userId!, role: "owner" });
  await db.insert(auditLogsTable).values({ workspaceId: w.id, action: "workspace_created", entityType: "workspace", entityId: w.id, actor: actor(req), details: `Workspace "${name}" created` });
  res.status(201).json(serialize(w));
});

router.get("/workspaces/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [w] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id));
  if (!w) return res.status(404).json({ error: "Not found" });
  const role = await getMemberRole(req.session.userId!, id);
  if (!role) return res.status(403).json({ error: "Access denied" });
  res.json(serialize(w));
});

router.put("/workspaces/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const role = await getMemberRole(req.session.userId!, id);
  if (!role) return res.status(403).json({ error: "Access denied" });
  if (!hasMinRole(role, "admin")) return res.status(403).json({ error: "Requires admin role or above" });

  const { name, businessType, country, language, defaultCurrency } = req.body;
  const [w] = await db.update(workspacesTable).set({ name, businessType, country, language, defaultCurrency }).where(eq(workspacesTable.id, id)).returning();
  if (!w) return res.status(404).json({ error: "Not found" });
  res.json(serialize(w));
});

router.delete("/workspaces/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const role = await getMemberRole(req.session.userId!, id);
  if (!role) return res.status(403).json({ error: "Access denied" });
  if (!hasMinRole(role, "owner")) return res.status(403).json({ error: "Requires owner role" });
  await db.delete(workspacesTable).where(eq(workspacesTable.id, id));
  res.status(204).send();
});

export default router;
