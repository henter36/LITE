import { Router } from "express";
import { db } from "@workspace/db";
import { brandProfilesTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serializeProfile(p: typeof brandProfilesTable.$inferSelect) {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    brandName: p.brandName,
    toneOfVoice: p.toneOfVoice,
    targetAudience: p.targetAudience,
    productsServices: p.productsServices,
    forbiddenClaims: p.forbiddenClaims,
    preferredChannels: JSON.parse(p.preferredChannels || "[]"),
    visualNotes: p.visualNotes,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/brand-profiles", async (req, res) => {
  let query = db.select().from(brandProfilesTable);
  const profiles = req.query.workspaceId
    ? await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.workspaceId, Number(req.query.workspaceId)))
    : await db.select().from(brandProfilesTable);
  res.json(profiles.map(serializeProfile));
});

router.post("/brand-profiles", async (req, res) => {
  const { workspaceId, brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes } = req.body;
  const [p] = await db.insert(brandProfilesTable).values({
    workspaceId, brandName, toneOfVoice, targetAudience, productsServices,
    forbiddenClaims: forbiddenClaims || "",
    preferredChannels: JSON.stringify(preferredChannels || []),
    visualNotes: visualNotes || "",
  }).returning();
  await db.insert(auditLogsTable).values({ workspaceId, action: "brand_profile_created", entityType: "brand_profile", entityId: p.id, actor: "user", details: `Brand profile "${brandName}" created` });
  res.status(201).json(serializeProfile(p));
});

router.get("/brand-profiles/:id", async (req, res) => {
  const [p] = await db.select().from(brandProfilesTable).where(eq(brandProfilesTable.id, parseInt(req.params.id)));
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(serializeProfile(p));
});

router.put("/brand-profiles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { workspaceId, brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes } = req.body;
  const [p] = await db.update(brandProfilesTable).set({
    workspaceId, brandName, toneOfVoice, targetAudience, productsServices,
    forbiddenClaims: forbiddenClaims || "",
    preferredChannels: JSON.stringify(preferredChannels || []),
    visualNotes: visualNotes || "",
  }).where(eq(brandProfilesTable.id, id)).returning();
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(serializeProfile(p));
});

export default router;
