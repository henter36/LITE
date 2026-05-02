import { Router } from "express";
import { db } from "@workspace/db";
import { brandProfilesTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireWorkspaceAccess, requireWorkspaceRole, getMemberRole, hasMinRole, actor } from "../middleware/auth";

const router = Router();

function serializeProfile(p: typeof brandProfilesTable.$inferSelect) {
  return {
    id: p.id, workspaceId: p.workspaceId, brandName: p.brandName,
    toneOfVoice: p.toneOfVoice, targetAudience: p.targetAudience,
    productsServices: p.productsServices, forbiddenClaims: p.forbiddenClaims,
    preferredChannels: JSON.parse(p.preferredChannels || "[]"),
    visualNotes: p.visualNotes, createdAt: p.createdAt.toISOString(),
  };
}

router.get("/brand-profiles", requireAuth, requireWorkspaceAccess, async (req, res): Promise<void> => {
  const profiles = req.query.workspaceId
    ? await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(brandProfilesTable);
  res.json(profiles.map(serializeProfile));
});

router.post("/brand-profiles", requireAuth, requireWorkspaceRole("editor"), async (req, res): Promise<void> => {
  const { workspaceId, brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes } = req.body;
  const [p] = await db.insert(brandProfilesTable).values({
    workspaceId, brandName, toneOfVoice, targetAudience, productsServices,
    forbiddenClaims: forbiddenClaims || "",
    preferredChannels: JSON.stringify(preferredChannels || []),
    visualNotes: visualNotes || "",
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId, action: "brand_profile_created", entityType: "brand_profile", entityId: p.id, actor: actor(req), details: `Brand profile "${brandName}" created` });
  res.status(201).json(serializeProfile(p));
});

router.get("/brand-profiles/:id", requireAuth, async (req, res): Promise<void> => {
  const [p] = await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.id, parseInt(String(req.params.id))));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const role = await getMemberRole(req.session.userId!, p.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  res.json(serializeProfile(p));
});

router.put("/brand-profiles/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [existing] = await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const role = await getMemberRole(req.session.userId!, existing.workspaceId);
  if (!role) { res.status(403).json({ error: "Access denied" }); return; }
  if (!hasMinRole(role, "editor")) { res.status(403).json({ error: "Requires editor role or above" }); return; }

  const { workspaceId, brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes } = req.body;
  const [updated] = await db.update(brandProfilesTable).set({
    workspaceId: workspaceId || existing.workspaceId, brandName, toneOfVoice, targetAudience, productsServices,
    forbiddenClaims: forbiddenClaims || "",
    preferredChannels: JSON.stringify(preferredChannels || []),
    visualNotes: visualNotes || "",
  }).where(eq(brandProfilesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  await db.insert(auditLogsTable).values({ workspaceId: updated.workspaceId, action: "brand_profile_updated", entityType: "brand_profile", entityId: updated.id, actor: actor(req), details: `Brand profile "${updated.brandName}" updated` });
  res.json(serializeProfile(updated));
});

export default router;
