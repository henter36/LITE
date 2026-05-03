import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";

export const campaignWorkflowIntakesTable = pgTable("campaign_workflow_intakes", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  businessDescription: text("business_description").notNull().default(""),
  campaignObjective: text("campaign_objective").notNull().default(""),
  targetAudience: text("target_audience").notNull().default(""),
  offerValueProposition: text("offer_value_proposition").notNull().default(""),
  brandTone: text("brand_tone").notNull().default(""),
  selectedChannels: text("selected_channels").notNull().default("[]"),
  landingUrl: text("landing_url").notNull().default(""),
  constraintsForbiddenClaims: text("constraints_forbidden_claims").notNull().default(""),
  availableCreativeAssets: text("available_creative_assets").notNull().default(""),
  missingInformation: text("missing_information").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignWorkflowIntakeSchema = createInsertSchema(campaignWorkflowIntakesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaignWorkflowIntake = z.infer<typeof insertCampaignWorkflowIntakeSchema>;
export type CampaignWorkflowIntake = typeof campaignWorkflowIntakesTable.$inferSelect;
