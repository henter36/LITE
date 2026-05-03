import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { campaignsTable } from "./campaigns";
import { usersTable } from "./users";

export const campaignTextSuggestionsTable = pgTable("campaign_text_suggestions", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  generatedByUserId: integer("generated_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"),
  source: text("source").notNull().default("mock"),
  hooks: text("hooks").notNull().default("[]"),
  adCopyVariants: text("ad_copy_variants").notNull().default("[]"),
  captions: text("captions").notNull().default("[]"),
  ctas: text("ctas").notNull().default("[]"),
  improvementNotes: text("improvement_notes").notNull().default("[]"),
  missingContextWarnings: text("missing_context_warnings").notNull().default("[]"),
  safetyNotes: text("safety_notes").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignTextSuggestionSchema = createInsertSchema(campaignTextSuggestionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaignTextSuggestion = z.infer<typeof insertCampaignTextSuggestionSchema>;
export type CampaignTextSuggestion = typeof campaignTextSuggestionsTable.$inferSelect;