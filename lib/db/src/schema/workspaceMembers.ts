import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { usersTable } from "./users";

export const ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type Role = typeof ROLES[number];

export const workspaceMembersTable = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("editor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.workspaceId, t.userId)]);

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembersTable).omit({ id: true, createdAt: true });
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
