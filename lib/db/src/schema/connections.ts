import { pgTable, serial, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const platformConnectionsTable = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  accountId: text("account_id").notNull(),
  status: text("status").notNull().default("connected"),
  mockSpend: doublePrecision("mock_spend").notNull().default(0),
  mockImpressions: integer("mock_impressions").notNull().default(0),
  mockClicks: integer("mock_clicks").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const syncJobsTable = pgTable("sync_jobs", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull(),
  status: text("status").notNull().default("completed"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnectionsTable).omit({ id: true, createdAt: true });
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;
export type PlatformConnection = typeof platformConnectionsTable.$inferSelect;
