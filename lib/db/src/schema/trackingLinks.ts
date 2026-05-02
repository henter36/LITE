import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { campaignsTable } from "./campaigns";

export const trackingLinksTable = pgTable("tracking_links", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  source: text("source").notNull(),
  medium: text("medium").notNull(),
  campaign: text("campaign").notNull(),
  content: text("content").notNull().default(""),
  finalUrl: text("final_url").notNull(),
  generatedTrackingUrl: text("generated_tracking_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrackingLinkSchema = createInsertSchema(trackingLinksTable).omit({ id: true, createdAt: true });
export type InsertTrackingLink = z.infer<typeof insertTrackingLinkSchema>;
export type TrackingLink = typeof trackingLinksTable.$inferSelect;
