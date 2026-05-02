import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function serializeCampaign(c: typeof campaignsTable.$inferSelect) {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    name: c.name,
    objective: c.objective,
    productService: c.productService,
    audience: c.audience,
    geography: c.geography,
    budgetSuggestion: c.budgetSuggestion,
    startDate: c.startDate,
    endDate: c.endDate,
    channels: JSON.parse(c.channels || "[]"),
    landingUrl: c.landingUrl,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", async (req, res) => {
  const conditions = [];
  if (req.query.workspaceId) conditions.push(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)));
  if (req.query.status) conditions.push(eq(campaignsTable.status, String(req.query.status)));
  const campaigns = conditions.length > 0
    ? await db.select().from(campaignsTable).where(and(...conditions)).orderBy(campaignsTable.createdAt)
    : await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  res.json(campaigns.map(serializeCampaign));
});

router.post("/campaigns", async (req, res) => {
  const { workspaceId, name, objective, productService, audience, geography, budgetSuggestion, startDate, endDate, channels, landingUrl } = req.body;
  const [c] = await db.insert(campaignsTable).values({
    workspaceId, name, objective, productService, audience, geography,
    budgetSuggestion: budgetSuggestion || 0,
    startDate, endDate,
    channels: JSON.stringify(channels || []),
    landingUrl: landingUrl || "",
    status: "draft",
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId, action: "campaign_created", entityType: "campaign", entityId: c.id, actor: "user", details: `Campaign "${name}" created` });
  res.status(201).json(serializeCampaign(c));
});

router.get("/campaigns/summary", async (req, res) => {
  const campaigns = req.query.workspaceId
    ? await db.select().from(campaignsTable).where(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(campaignsTable);
  const summary = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === "draft").length,
    active: campaigns.filter(c => c.status === "active").length,
    approved: campaigns.filter(c => c.status === "approved").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };
  res.json(summary);
});

router.get("/campaigns/:id", async (req, res) => {
  const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, parseInt(req.params.id)));
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(serializeCampaign(c));
});

router.put("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { workspaceId, name, objective, productService, audience, geography, budgetSuggestion, startDate, endDate, channels, landingUrl } = req.body;
  const [c] = await db.update(campaignsTable).set({
    workspaceId, name, objective, productService, audience, geography,
    budgetSuggestion: budgetSuggestion || 0,
    startDate, endDate,
    channels: JSON.stringify(channels || []),
    landingUrl: landingUrl || "",
  }).where(eq(campaignsTable.id, id)).returning();
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(serializeCampaign(c));
});

router.delete("/campaigns/:id", async (req, res) => {
  await db.delete(campaignsTable).where(eq(campaignsTable.id, parseInt(req.params.id)));
  res.status(204).send();
});

router.post("/campaigns/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  const [c] = await db.update(campaignsTable).set({ status: "approved" }).where(eq(campaignsTable.id, id)).returning();
  if (!c) return res.status(404).json({ error: "Not found" });
  await db.insert(auditLogsTable).values({ workspaceId: c.workspaceId, action: "campaign_approved", entityType: "campaign", entityId: c.id, actor: "user", details: `Campaign "${c.name}" approved` });
  res.json(serializeCampaign(c));
});

export default router;
