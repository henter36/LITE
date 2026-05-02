import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const approvalDecisionsTable = pgTable("approval_decisions", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id"),
  campaignId: integer("campaign_id"),
  actor: text("actor").notNull(),
  decision: text("decision").notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApprovalDecisionSchema = createInsertSchema(approvalDecisionsTable).omit({ id: true, createdAt: true });
export type InsertApprovalDecision = z.infer<typeof insertApprovalDecisionSchema>;
export type ApprovalDecision = typeof approvalDecisionsTable.$inferSelect;
