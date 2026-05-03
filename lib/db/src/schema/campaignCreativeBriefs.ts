import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";

export const campaignCreativeBriefsTable = pgTable("campaign_creative_briefs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  coreMessage: text("core_message").notNull().default(""),
  audience: text("audience").notNull().default(""),
  tone: text("tone").notNull().default(""),
  textDirection: text("text_direction").notNull().default(""),
  visualDirection: text("visual_direction").notNull().default(""),
  videoDirection: text("video_direction").notNull().default(""),
  channelAdaptations: text("channel_adaptations").notNull().default("[]"),
  usageRightsReminders: text("usage_rights_reminders").notNull().default("[]"),
  prohibitedElements: text("prohibited_elements").notNull().default("[]"),
  aiProvider: text("ai_provider").notNull().default("mock"),
  aiModel: text("ai_model").notNull().default("mock-v1"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignCreativeBriefSchema = createInsertSchema(campaignCreativeBriefsTable).omit({ id: true, createdAt: true });
export type InsertCampaignCreativeBrief = z.infer<typeof insertCampaignCreativeBriefSchema>;
export type CampaignCreativeBrief = typeof campaignCreativeBriefsTable.$inferSelect;
