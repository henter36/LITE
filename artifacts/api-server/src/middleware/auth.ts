import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { workspaceMembersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type Role = "viewer" | "editor" | "admin" | "owner";
const ROLE_HIERARCHY: Role[] = ["viewer", "editor", "admin", "owner"];

function getWorkspaceId(req: Request): number | null {
  const raw = req.params["workspaceId"] ?? req.query["workspaceId"] ?? req.body?.workspaceId;
  const n = Number(raw);
  return n > 0 ? n : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return next();
  const userId = req.session.userId!;

  db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId)))
    .then(([member]) => {
      if (!member) {
        return res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
      }
      req.session.role = member.role;
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

    db.select().from(workspaceMembersTable)
      .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId)))
      .then(([member]) => {
        if (!member) {
          return res.status(403).json({ error: "Access denied: you are not a member of this workspace" });
        }
        const userLevel = ROLE_HIERARCHY.indexOf(member.role as Role);
        const requiredLevel = ROLE_HIERARCHY.indexOf(minRole);
        if (userLevel < requiredLevel) {
          return res.status(403).json({ error: `Insufficient permissions. Required: ${minRole}, your role: ${member.role}` });
        }
        req.session.role = member.role;
        req.session.activeWorkspaceId = workspaceId;
        next();
      })
      .catch(() => res.status(500).json({ error: "Authorization check failed" }));
  };
}

export function actor(req: Request): string {
  return req.session.name || req.session.email || "system";
}
