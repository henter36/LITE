import { Router } from "express";
import { db } from "@workspace/db";
import { mediaAssetsTable, auditLogsTable, campaignsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  requireAuth,
  requireWorkspaceRole,
  getMemberRole,
  hasMinRole,
  actor,
} from "../middleware/auth";

const router = Router();

const VALID_TYPES = ["image", "video", "document", "other"] as const;
const VALID_STATUSES = ["draft", "needs_review", "approved", "rejected"] as const;

function serializeAsset(a: typeof mediaAssetsTable.$inferSelect) {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    campaignId: a.campaignId ?? null,
    title: a.title,
    type: a.type,
    urlOrReference: a.urlOrReference,
    description: a.description,
    channel: a.channel ?? null,
    status: a.status,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

router.get(
  "/media-assets",
  requireAuth,
  async (req, res): Promise<void> => {
    const { workspaceId, campaignId, status } = req.query;

    if (!workspaceId && !campaignId) {
      res.status(400).json({ error: "workspaceId or campaignId is required" });
      return;
    }

    try {
      const conditions = [];

      if (workspaceId) {
        // Verify caller is a member of the requested workspace
        const role = await getMemberRole(req.session.userId!, Number(workspaceId));
        if (!role) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
        conditions.push(eq(mediaAssetsTable.workspaceId, Number(workspaceId)));
      }

      if (campaignId) {
        const campaignIdNum = Number(campaignId);
        const [campaign] = await db
          .select({ workspaceId: campaignsTable.workspaceId })
          .from(campaignsTable)
          .where(eq(campaignsTable.id, campaignIdNum));

        if (!campaign) {
          res.status(404).json({ error: "Campaign not found" });
          return;
        }

        // Verify caller is a member of the campaign's workspace
        const role = await getMemberRole(req.session.userId!, campaign.workspaceId);
        if (!role) {
          res.status(403).json({ error: "Access denied" });
          return;
        }

        conditions.push(eq(mediaAssetsTable.campaignId, campaignIdNum));
      }

      if (status) {
        const s = String(status);
        if (!VALID_STATUSES.includes(s as (typeof VALID_STATUSES)[number])) {
          res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
          return;
        }
        conditions.push(eq(mediaAssetsTable.status, s));
      }

      const assets = await db
        .select()
        .from(mediaAssetsTable)
        .where(and(...conditions))
        .orderBy(mediaAssetsTable.createdAt);

      res.json(assets.map(serializeAsset));
    } catch {
      res.status(500).json({ error: "Failed to fetch media assets" });
    }
  }
);

router.post(
  "/media-assets",
  requireAuth,
  requireWorkspaceRole("editor"),
  async (req, res): Promise<void> => {
    const { workspaceId, campaignId, title, type, urlOrReference, description, channel, status } =
      req.body;

    if (!workspaceId || !title || !type || !urlOrReference) {
      res
        .status(400)
        .json({ error: "Missing required fields: workspaceId, title, type, urlOrReference" });
      return;
    }

    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
      return;
    }

    const resolvedStatus = status ?? "draft";
    if (!VALID_STATUSES.includes(resolvedStatus as (typeof VALID_STATUSES)[number])) {
      res
        .status(400)
        .json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    if (campaignId) {
      const [campaign] = await db
        .select({ workspaceId: campaignsTable.workspaceId })
        .from(campaignsTable)
        .where(eq(campaignsTable.id, Number(campaignId)));

      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.workspaceId !== Number(workspaceId)) {
        res.status(400).json({ error: "Campaign does not belong to this workspace" });
        return;
      }
    }

    try {
      const [asset] = await db
        .insert(mediaAssetsTable)
        .values({
          workspaceId: Number(workspaceId),
          campaignId: campaignId ? Number(campaignId) : null,
          title,
          type,
          urlOrReference,
          description: description ?? "",
          channel: channel ?? null,
          status: resolvedStatus,
          createdBy: req.session.userId!,
        })
        .returning();

      await db.insert(auditLogsTable).values({
        workspaceId: Number(workspaceId),
        action: "media_asset_created",
        entityType: "media_asset",
        entityId: asset.id,
        actor: actor(req),
        details: `Media asset "${title}" (${type}) created`,
      });

      res.status(201).json(serializeAsset(asset));
    } catch {
      res.status(500).json({ error: "Failed to create media asset" });
    }
  }
);

router.patch(
  "/media-assets/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);

    const [existing] = await db
      .select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Media asset not found" });
      return;
    }

    const role = await getMemberRole(req.session.userId!, existing.workspaceId);
    if (!role) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!hasMinRole(role, "editor")) {
      res.status(403).json({ error: "Requires editor role or above" });
      return;
    }

    const { title, type, urlOrReference, description, channel, status, campaignId } = req.body;

    if (type !== undefined && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
      return;
    }

    if (status !== undefined && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      res
        .status(400)
        .json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    if (campaignId !== undefined && campaignId !== null) {
      const [campaign] = await db
        .select({ workspaceId: campaignsTable.workspaceId })
        .from(campaignsTable)
        .where(eq(campaignsTable.id, Number(campaignId)));

      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      if (campaign.workspaceId !== existing.workspaceId) {
        res.status(400).json({ error: "Campaign does not belong to this workspace" });
        return;
      }
    }

    const updates: Partial<typeof mediaAssetsTable.$inferInsert> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (type !== undefined) updates.type = type;
    if (urlOrReference !== undefined) updates.urlOrReference = urlOrReference;
    if (description !== undefined) updates.description = description;
    if (channel !== undefined) updates.channel = channel;
    if (status !== undefined) updates.status = status;
    if (campaignId !== undefined) updates.campaignId = campaignId === null ? null : Number(campaignId);

    try {
      const [updated] = await db
        .update(mediaAssetsTable)
        .set(updates)
        .where(eq(mediaAssetsTable.id, id))
        .returning();

      const changeDetails: string[] = [];
      if (status !== undefined && status !== existing.status)
        changeDetails.push(`status: ${existing.status} → ${status}`);
      if (title !== undefined && title !== existing.title)
        changeDetails.push(`title: "${existing.title}" → "${title}"`);

      await db.insert(auditLogsTable).values({
        workspaceId: existing.workspaceId,
        action: "media_asset_updated",
        entityType: "media_asset",
        entityId: id,
        actor: actor(req),
        details:
          changeDetails.length > 0
            ? `Media asset "${updated.title}" updated — ${changeDetails.join("; ")}`
            : `Media asset "${updated.title}" updated`,
      });

      res.json(serializeAsset(updated));
    } catch {
      res.status(500).json({ error: "Failed to update media asset" });
    }
  }
);

router.delete(
  "/media-assets/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);

    const [existing] = await db
      .select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Media asset not found" });
      return;
    }

    const role = await getMemberRole(req.session.userId!, existing.workspaceId);
    if (!role) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!hasMinRole(role, "admin")) {
      res.status(403).json({ error: "Requires admin role or above to delete assets" });
      return;
    }

    if (existing.status === "approved") {
      res
        .status(409)
        .json({ error: "Cannot delete an approved asset. Change status first." });
      return;
    }

    try {
      await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));

      await db.insert(auditLogsTable).values({
        workspaceId: existing.workspaceId,
        action: "media_asset_deleted",
        entityType: "media_asset",
        entityId: id,
        actor: actor(req),
        details: `Media asset "${existing.title}" (${existing.type}, status: ${existing.status}) deleted`,
      });

      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete media asset" });
    }
  }
);

export default router;
