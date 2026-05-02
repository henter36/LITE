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

router.get("/brand-profiles", requireAuth, requireWorkspaceAccess, async (req, res) => {
  const profiles = req.query.workspaceId
    ? await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(brandProfilesTable);
  res.json(profiles.map(serializeProfile));
});

router.post("/brand-profiles", requireAuth, requireWorkspaceRole("editor"), async (req, res) => {
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

router.get("/brand-profiles/:id", requireAuth, async (req, res) => {
  const [p] = await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.id, parseInt(req.params.id)));
  if (!p) return res.status(404).json({ error: "Not found" });
  const role = await getMemberRole(req.session.userId!, p.workspaceId);
  if (!role) return res.status(403).json({ error: "Access denied" });
  res.json(serializeProfile(p));
});

router.put("/brand-profiles/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });
  const role = await getMemberRole(req.session.userId!, existing.workspaceId);
  if (!role) return res.status(403).json({ error: "Access denied" });
  if (!hasMinRole(role, "editor")) return res.status(403).json({ error: "Requires editor role or above" });

  const { workspaceId, brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes } = req.body;
  const [p] = await db.update(brandProfilesTable).set({
    workspaceId: workspaceId || existing.workspaceId, brandName, toneOfVoice, targetAudience, productsServices,
    forbiddenClaims: forbiddenClaims || "",
    preferredChannels: JSON.stringify(preferredChannels || []),
    visualNotes: visualNotes || "",
  }).where(eq(brandProfilesTable.id, id)).returning();
  if (!p) return res.status(404).json({ error: "Not found" });
  await db.insert(auditLogsTable).values({ workspaceId: p.workspaceId, action: "brand_profile_updated", entityType: "brand_profile", entityId: p.id, actor: actor(req), details: `Brand profile "${p.brandName}" updated` });
  res.json(serializeProfile(p));
});

export default router;
