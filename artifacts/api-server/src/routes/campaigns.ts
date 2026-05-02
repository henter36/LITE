import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireWorkspaceAccess, requireWorkspaceRole, actor } from "../middleware/auth";

const router = Router();

const VALID_OBJECTIVES = ["awareness", "leads", "sales", "traffic", "engagement", "retention"];
const VALID_STATUSES = ["draft", "active", "approved", "completed", "archived"];

function serializeCampaign(c: typeof campaignsTable.$inferSelect) {
  return {
    id: c.id, workspaceId: c.workspaceId, name: c.name, objective: c.objective,
    productService: c.productService, audience: c.audience, geography: c.geography,
    budgetSuggestion: c.budgetSuggestion, startDate: c.startDate, endDate: c.endDate,
    channels: JSON.parse(c.channels || "[]"), landingUrl: c.landingUrl,
    status: c.status, createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", requireAuth, requireWorkspaceAccess, async (req, res) => {
  const conditions = [];
  if (req.query.workspaceId) conditions.push(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)));
  if (req.query.status) {
    const s = String(req.query.status);
    if (!VALID_STATUSES.includes(s)) return res.status(400).json({ error: `Invalid status` });
    conditions.push(eq(campaignsTable.status, s));
  }
  const campaigns = conditions.length > 0
    ? await db.select().from(campaignsTable).where(and(...conditions)).orderBy(campaignsTable.createdAt)
    : await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  res.json(campaigns.map(serializeCampaign));
});

router.post("/campaigns", requireAuth, requireWorkspaceRole("editor"), async (req, res) => {
  const { workspaceId, name, objective, productService, audience, geography, budgetSuggestion, startDate, endDate, channels, landingUrl } = req.body;
  if (!workspaceId || !name || !objective || !productService || !audience || !geography || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields: workspaceId, name, objective, productService, audience, geography, startDate, endDate" });
  }
  if (!VALID_OBJECTIVES.includes(objective)) {
    return res.status(400).json({ error: `Invalid objective. Must be one of: ${VALID_OBJECTIVES.join(", ")}` });
  }
  try {
    const [c] = await db.insert(campaignsTable).values({
      workspaceId, name, objective, productService, audience, geography,
      budgetSuggestion: budgetSuggestion || 0, startDate, endDate,
      channels: JSON.stringify(channels || []), landingUrl: landingUrl || "", status: "draft",
    }).returning();
    await db.insert(auditLogsTable).values({ workspaceId, action: "campaign_created", entityType: "campaign", entityId: c.id, actor: actor(req), details: `Campaign "${name}" created` });
    res.status(201).json(serializeCampaign(c));
  } catch { res.status(500).json({ error: "Failed to create campaign" }); }
});

router.get("/campaigns/summary", requireAuth, requireWorkspaceAccess, async (req, res) => {
  const campaigns = req.query.workspaceId
    ? await db.select().from(campaignsTable).where(eq(campaignsTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(campaignsTable);
  res.json({
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === "draft").length,
    active: campaigns.filter(c => c.status === "active").length,
    approved: campaigns.filter(c => c.status === "approved").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  });
});

router.get("/campaigns/:id", requireAuth, async (req, res) => {
  const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, parseInt(req.params.id)));
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(serializeCampaign(c));
});

router.put("/campaigns/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { workspaceId, name, objective, productService, audience, geography, budgetSuggestion, startDate, endDate, channels, landingUrl } = req.body;
  if (!name || !objective || !productService || !audience || !geography || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!VALID_OBJECTIVES.includes(objective)) {
    return res.status(400).json({ error: `Invalid objective` });
  }
  try {
    const [c] = await db.update(campaignsTable).set({
      workspaceId, name, objective, productService, audience, geography,
      budgetSuggestion: budgetSuggestion || 0, startDate, endDate,
      channels: JSON.stringify(channels || []), landingUrl: landingUrl || "",
    }).where(eq(campaignsTable.id, id)).returning();
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(serializeCampaign(c));
  } catch { res.status(500).json({ error: "Failed to update campaign" }); }
});

router.delete("/campaigns/:id", requireAuth, requireWorkspaceRole("admin"), async (req, res) => {
  await db.delete(campaignsTable).where(eq(campaignsTable.id, parseInt(req.params.id)));
  res.status(204).send();
});

router.post("/campaigns/:id/approve", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [c] = await db.update(campaignsTable).set({ status: "approved" }).where(eq(campaignsTable.id, id)).returning();
  if (!c) return res.status(404).json({ error: "Not found" });
  await db.insert(auditLogsTable).values({ workspaceId: c.workspaceId, action: "campaign_approved", entityType: "campaign", entityId: c.id, actor: actor(req), details: `Campaign "${c.name}" approved` });
  res.json(serializeCampaign(c));
});

export default router;
