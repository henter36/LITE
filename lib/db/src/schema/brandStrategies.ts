import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { brandProfilesTable } from "./brandProfiles";
import { usersTable } from "./users";

export const brandStrategiesTable = pgTable("brand_strategies", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  brandProfileId: integer("brand_profile_id").references(() => brandProfilesTable.id, { onDelete: "set null" }),
  generatedByUserId: integer("generated_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"),
  source: text("source").notNull().default("mock"),
  strategySummary: text("strategy_summary").notNull().default(""),
  positioning: text("positioning").notNull().default(""),
  idealCustomerProfile: text("ideal_customer_profile").notNull().default(""),
  primaryAudience: text("primary_audience").notNull().default(""),
  secondaryAudience: text("secondary_audience").notNull().default(""),
  keyMessages: text("key_messages").notNull().default("[]"),
  valueProposition: text("value_proposition").notNull().default(""),
  contentPillars: text("content_pillars").notNull().default("[]"),
  channelStrategy: text("channel_strategy").notNull().default("[]"),
  toneGuidelines: text("tone_guidelines").notNull().default(""),
  ctaGuidelines: text("cta_guidelines").notNull().default(""),
  forbiddenClaims: text("forbidden_claims").notNull().default("[]"),
  riskNotes: text("risk_notes").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBrandStrategySchema = createInsertSchema(brandStrategiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBrandStrategy = z.infer<typeof insertBrandStrategySchema>;
export type BrandStrategy = typeof brandStrategiesTable.$inferSelect;
