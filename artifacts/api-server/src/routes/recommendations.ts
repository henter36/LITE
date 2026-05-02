import { Router } from "express";
import { db } from "@workspace/db";
import { recommendationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireWorkspaceAccess, requireWorkspaceRole, actor } from "../middleware/auth";
import { generateRecommendationsForWorkspace } from "../lib/generate-recommendations";

const router = Router();

function serialize(r: typeof recommendationsTable.$inferSelect) {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    campaignId: r.campaignId,
    type: r.type,
    title: r.title,
    description: r.description,
    priority: r.priority,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/recommendations", requireAuth, requireWorkspaceAccess, async (req, res) => {
  const conditions = [];
  if (req.query.workspaceId) conditions.push(eq(recommendationsTable.workspaceId, Number(req.query.workspaceId)));
  if (req.query.campaignId) conditions.push(eq(recommendationsTable.campaignId, Number(req.query.campaignId)));
  if (req.query.isRead !== undefined) conditions.push(eq(recommendationsTable.isRead, req.query.isRead === "true"));
  const recs = conditions.length > 0
    ? await db.select().from(recommendationsTable).where(and(...conditions)).orderBy(recommendationsTable.createdAt)
    : await db.select().from(recommendationsTable).orderBy(recommendationsTable.createdAt);
  res.json(recs.map(serialize));
});

router.patch("/recommendations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [existing] = await db.select().from(recommendationsTable).where(eq(recommendationsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const { isRead } = req.body;
  if (typeof isRead !== "boolean") { res.status(400).json({ error: "isRead must be a boolean" }); return; }
  const [updated] = await db.update(recommendationsTable)
    .set({ isRead })
    .where(eq(recommendationsTable.id, id))
    .returning();
  res.json(serialize(updated));
});

router.post("/recommendations/generate", requireAuth, requireWorkspaceRole("editor"), async (req, res) => {
  const { workspaceId } = req.body;
  await generateRecommendationsForWorkspace(Number(workspaceId), actor(req));
  const all = await db.select().from(recommendationsTable).where(eq(recommendationsTable.workspaceId, Number(workspaceId)));
  res.json(all.map(serialize));
});

export default router;
