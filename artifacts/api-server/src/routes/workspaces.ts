import { Router } from "express";
import { db } from "@workspace/db";
import { workspacesTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/workspaces", async (req, res) => {
  const workspaces = await db.select().from(workspacesTable).orderBy(workspacesTable.createdAt);
  res.json(workspaces.map(w => ({
    id: w.id, name: w.name, businessType: w.businessType, country: w.country,
    language: w.language, defaultCurrency: w.defaultCurrency,
    createdAt: w.createdAt.toISOString(),
  })));
});

router.post("/workspaces", async (req, res) => {
  const { name, businessType, country, language, defaultCurrency } = req.body;
  if (!name || !businessType || !country || !language || !defaultCurrency) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const [w] = await db.insert(workspacesTable).values({ name, businessType, country, language, defaultCurrency }).returning();
  await db.insert(auditLogsTable).values({ workspaceId: w.id, action: "workspace_created", entityType: "workspace", entityId: w.id, actor: "user", details: `Workspace "${name}" created` });
  res.status(201).json({ id: w.id, name: w.name, businessType: w.businessType, country: w.country, language: w.language, defaultCurrency: w.defaultCurrency, createdAt: w.createdAt.toISOString() });
});

router.get("/workspaces/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [w] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id));
  if (!w) return res.status(404).json({ error: "Not found" });
  res.json({ id: w.id, name: w.name, businessType: w.businessType, country: w.country, language: w.language, defaultCurrency: w.defaultCurrency, createdAt: w.createdAt.toISOString() });
});

router.put("/workspaces/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, businessType, country, language, defaultCurrency } = req.body;
  const [w] = await db.update(workspacesTable).set({ name, businessType, country, language, defaultCurrency }).where(eq(workspacesTable.id, id)).returning();
  if (!w) return res.status(404).json({ error: "Not found" });
  res.json({ id: w.id, name: w.name, businessType: w.businessType, country: w.country, language: w.language, defaultCurrency: w.defaultCurrency, createdAt: w.createdAt.toISOString() });
});

router.delete("/workspaces/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(workspacesTable).where(eq(workspacesTable.id, id));
  res.status(204).send();
});

export default router;
