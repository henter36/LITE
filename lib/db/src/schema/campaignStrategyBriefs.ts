import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";

export const campaignStrategyBriefsTable = pgTable("campaign_strategy_briefs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  objective: text("objective").notNull().default(""),
  targetAudience: text("target_audience").notNull().default(""),
  positioning: text("positioning").notNull().default(""),
  keyMessage: text("key_message").notNull().default(""),
  recommendedChannels: text("recommended_channels").notNull().default("[]"),
  contentAngles: text("content_angles").notNull().default("[]"),
  ctaDirection: text("cta_direction").notNull().default(""),
  requiredAssets: text("required_assets").notNull().default("[]"),
  missingContextWarnings: text("missing_context_warnings").notNull().default("[]"),
  risksSafetyNotes: text("risks_safety_notes").notNull().default("[]"),
  aiProvider: text("ai_provider").notNull().default("mock"),
  aiModel: text("ai_model").notNull().default("mock-v1"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignStrategyBriefSchema = createInsertSchema(campaignStrategyBriefsTable).omit({ id: true, createdAt: true });
export type InsertCampaignStrategyBrief = z.infer<typeof insertCampaignStrategyBriefSchema>;
export type CampaignStrategyBrief = typeof campaignStrategyBriefsTable.$inferSelect;
