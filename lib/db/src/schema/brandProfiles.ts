import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const brandProfilesTable = pgTable("brand_profiles", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  toneOfVoice: text("tone_of_voice").notNull(),
  targetAudience: text("target_audience").notNull(),
  productsServices: text("products_services").notNull(),
  forbiddenClaims: text("forbidden_claims").notNull().default(""),
  preferredChannels: text("preferred_channels").notNull().default("[]"),
  visualNotes: text("visual_notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBrandProfileSchema = createInsertSchema(brandProfilesTable).omit({ id: true, createdAt: true });
export type InsertBrandProfile = z.infer<typeof insertBrandProfileSchema>;
export type BrandProfile = typeof brandProfilesTable.$inferSelect;
