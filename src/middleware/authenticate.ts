// middleware/authenticate.ts — protects routes that require a logged-in user.
// It reads the Authorization header, verifies the JWT, and attaches the user's
// info to the request so controllers know who is making the call. If the token
// is missing or invalid, the request is rejected with a 401 before it ever
// reaches the controller.

import type { Request, Response, NextFunction } from "express"
import { verifyToken, type JwtPayload } from "./jwt.js"

// Extend Express Request with a user field
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

/**
 * Runs before every protected route.
 * Validates the Authorization: Bearer <token> header.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token required" })
    return
  }

  const token = authHeader.slice(7) // Strip "Bearer "
  const payload = verifyToken(token)

  if (!payload) {
    res.status(401).json({ message: "Invalid token" })
    return
  }

  req.user = payload // Attach user info to the request
  next()
}
