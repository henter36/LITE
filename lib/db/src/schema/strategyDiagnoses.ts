import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { strategyIntakesTable } from "./strategyIntakes";

export const strategyDiagnosesTable = pgTable("strategy_diagnoses", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  intakeId: integer("intake_id").notNull().references(() => strategyIntakesTable.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  whatIsMissing: text("what_is_missing").notNull(),
  whatToTestFirst: text("what_to_test_first").notNull(),
  likelyCreativeDirection: text("likely_creative_direction").notNull(),
  audienceSummary: text("audience_summary").notNull(),
  offerSummary: text("offer_summary").notNull(),
  topObjections: text("top_objections").notNull().default(""),
  suggestedCTA: text("suggested_cta").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStrategyDiagnosisSchema = createInsertSchema(strategyDiagnosesTable).omit({ id: true, createdAt: true });
export type InsertStrategyDiagnosis = z.infer<typeof insertStrategyDiagnosisSchema>;
export type StrategyDiagnosis = typeof strategyDiagnosesTable.$inferSelect;