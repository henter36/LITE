import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const strategyIntakesTable = pgTable("strategy_intakes", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  businessCategory: text("business_category").notNull(),
  currentOffer: text("current_offer").notNull(),
  targetAudience: text("target_audience").notNull(),
  geography: text("geography").notNull(),
  budgetRange: text("budget_range").notNull(),
  primaryGoal: text("primary_goal").notNull(),
  brandVoice: text("brand_voice").notNull(),
  painPoints: text("pain_points").notNull().default(""),
  availableAssets: text("available_assets").notNull().default(""),
  previousLearnings: text("previous_learnings").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStrategyIntakeSchema = createInsertSchema(strategyIntakesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStrategyIntake = z.infer<typeof insertStrategyIntakeSchema>;
export type StrategyIntake = typeof strategyIntakesTable.$inferSelect;