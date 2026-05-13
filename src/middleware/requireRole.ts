// middleware/requireRole.ts — restricts a route to users with a specific role.
// Used after authenticate.ts (which confirms who the user is), this middleware
// confirms what they're allowed to do. For example, only admins and superusers
// can reach the /admin routes.

import type { Request, Response, NextFunction } from "express"
import type { Role } from "../domain/user.js"

/**
 * Allows only users with one of the specified roles.
 * Must be used after the authenticate() middleware.
 *
 * Example: requireRole("admin", "superuser")
 */
export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role | undefined

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ message: "You do not have permission to perform this action" })
      return
    }

    next()
  }
