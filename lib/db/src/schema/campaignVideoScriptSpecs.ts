import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";

export const campaignVideoScriptSpecsTable = pgTable("campaign_video_script_specs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  videoConcept: text("video_concept").notNull().default(""),
  shortScript: text("short_script").notNull().default(""),
  storyboardOutline: text("storyboard_outline").notNull().default(""),
  sceneList: text("scene_list").notNull().default("[]"),
  voiceoverDraft: text("voiceover_draft").notNull().default(""),
  captionDraft: text("caption_draft").notNull().default(""),
  platformAspectRatioNotes: text("platform_aspect_ratio_notes").notNull().default("[]"),
  aiProvider: text("ai_provider").notNull().default("mock"),
  aiModel: text("ai_model").notNull().default("mock-v1"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignVideoScriptSpecSchema = createInsertSchema(campaignVideoScriptSpecsTable).omit({ id: true, createdAt: true });
export type InsertCampaignVideoScriptSpec = z.infer<typeof insertCampaignVideoScriptSpecSchema>;
export type CampaignVideoScriptSpec = typeof campaignVideoScriptSpecsTable.$inferSelect;
