import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { campaignsTable } from "./campaigns";

export const generatedAssetsTable = pgTable("generated_assets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  shortCaption: text("short_caption").notNull(),
  longCaption: text("long_caption").notNull(),
  cta: text("cta").notNull(),
  hashtags: text("hashtags").notNull().default("[]"),
  videoScript: text("video_script").notNull().default(""),
  storyboardOutline: text("storyboard_outline").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelVariantsTable = pgTable("channel_variants", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => generatedAssetsTable.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  headline: text("headline").notNull(),
  caption: text("caption").notNull(),
  cta: text("cta").notNull(),
  hashtags: text("hashtags").notNull().default("[]"),
});

export const insertGeneratedAssetSchema = createInsertSchema(generatedAssetsTable).omit({ id: true, createdAt: true });
export type InsertGeneratedAsset = z.infer<typeof insertGeneratedAssetSchema>;
export type GeneratedAsset = typeof generatedAssetsTable.$inferSelect;

export const insertChannelVariantSchema = createInsertSchema(channelVariantsTable).omit({ id: true });
export type InsertChannelVariant = z.infer<typeof insertChannelVariantSchema>;
export type ChannelVariant = typeof channelVariantsTable.$inferSelect;
