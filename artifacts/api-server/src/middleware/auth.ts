import type { Request, Response, NextFunction } from "express";
import { db, workspaceMembersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type Role = "viewer" | "editor" | "admin" | "owner";
export const ROLE_HIERARCHY: Role[] = ["viewer", "editor", "admin", "owner"];

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

function getWorkspaceId(req: Request): number | null {
  const raw = req.params["workspaceId"] ?? req.query["workspaceId"] ?? req.body?.workspaceId;
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): void {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  const userId = req.session.userId!;
  getMemberRole(userId, workspaceId)
    .then((role) => {
      if (!role) {
        res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
        return;
      }
      req.session.role = role;
      req.session.activeWorkspaceId = workspaceId;
      next();
    })
    .catch(() => res.status(500).json({ error: "Authorization check failed" }));
}

export function requireWorkspaceRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const workspaceId = getWorkspaceId(req);
    if (!workspaceId) {
      res.status(400).json({ error: "workspaceId is required" });
      return;
    }
    const userId = req.session.userId!;
    getMemberRole(userId, workspaceId)
      .then((role) => {
        if (!role) {
          res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
          return;
        }
        if (!hasMinRole(role, minRole)) {
          res.status(403).json({ error: `Insufficient permissions. Required: ${minRole}, your role: ${role}` });
          return;
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
