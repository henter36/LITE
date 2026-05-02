import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { workspaceMembersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type Role = "viewer" | "editor" | "admin" | "owner";
export const ROLE_HIERARCHY: Role[] = ["viewer", "editor", "admin", "owner"];

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

function getWorkspaceId(req: Request): number | null {
  const raw = req.params["workspaceId"] ?? req.query["workspaceId"] ?? req.body?.workspaceId;
  const n = Number(raw);
  return n > 0 ? n : null;
}

export async function getMemberRole(userId: number, workspaceId: number): Promise<Role | null> {
  const [member] = await db
    .select({ role: workspaceMembersTable.role })
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
      ),
    );
  return member ? (member.role as Role) : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  const userId = req.session.userId!;
  getMemberRole(userId, workspaceId)
    .then((role) => {
      if (!role) {
        return res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
      }
      req.session.role = role;
      req.session.activeWorkspaceId = workspaceId;
      next();
    })
    .catch(() => res.status(500).json({ error: "Authorization check failed" }));
}

export function requireWorkspaceRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = getWorkspaceId(req);
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const userId = req.session.userId!;
    getMemberRole(userId, workspaceId)
      .then((role) => {
        if (!role) {
          return res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
        }
        if (!hasMinRole(role, minRole)) {
          return res.status(403).json({ error: `Insufficient permissions. Required: ${minRole}, your role: ${role}` });
        }
        req.session.role = role;
        req.session.activeWorkspaceId = workspaceId;
        next();
      })
      .catch(() => res.status(500).json({ error: "Authorization check failed" }));
  };
}

export function actor(req: Request): string {
  return req.session.name || req.session.email || "system";
}
