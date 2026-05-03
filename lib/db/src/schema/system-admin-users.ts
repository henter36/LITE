import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const SYSTEM_ADMIN_ROLES = ["system_admin", "super_admin"] as const;
export type SystemAdminRole = typeof SYSTEM_ADMIN_ROLES[number];

export const systemAdminUsersTable = pgTable(
  "system_admin_users",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().unique(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdUnique: uniqueIndex("system_admin_users_user_id_unique").on(t.userId),
  }),
);
