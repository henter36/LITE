import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";

export const campaignImagePromptSpecsTable = pgTable("campaign_image_prompt_specs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  imagePrompts: text("image_prompts").notNull().default("[]"),
  compositionNotes: text("composition_notes").notNull().default(""),
  styleDirection: text("style_direction").notNull().default(""),
  productSceneNotes: text("product_scene_notes").notNull().default(""),
  channelFormatNotes: text("channel_format_notes").notNull().default("[]"),
  usageRightsReminders: text("usage_rights_reminders").notNull().default("[]"),
  aiProvider: text("ai_provider").notNull().default("mock"),
  aiModel: text("ai_model").notNull().default("mock-v1"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignImagePromptSpecSchema = createInsertSchema(campaignImagePromptSpecsTable).omit({ id: true, createdAt: true });
export type InsertCampaignImagePromptSpec = z.infer<typeof insertCampaignImagePromptSpecSchema>;
export type CampaignImagePromptSpec = typeof campaignImagePromptSpecsTable.$inferSelect;
