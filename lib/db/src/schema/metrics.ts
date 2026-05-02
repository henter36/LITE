import { pgTable, serial, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { campaignsTable } from "./campaigns";

export const adMetricsDailyTable = pgTable("ad_metrics_daily", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  date: text("date").notNull(),
  spend: doublePrecision("spend").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  ctr: doublePrecision("ctr").notNull().default(0),
  cpc: doublePrecision("cpc").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
});

export const insertAdMetricsDailySchema = createInsertSchema(adMetricsDailyTable).omit({ id: true });
export type InsertAdMetricsDaily = z.infer<typeof insertAdMetricsDailySchema>;
export type AdMetricsDaily = typeof adMetricsDailyTable.$inferSelect;
