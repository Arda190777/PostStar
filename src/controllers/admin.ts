// controllers/admin.ts — admin-only actions: view site stats, delete any post
// or comment regardless of who wrote it, and change a user's account status
// (block, delete, or reactivate). Only admins and superusers can reach these
// endpoints — enforced by the requireRole middleware in admin.routes.ts.

import type { Request, Response } from "express"
import { getSiteStats, getUserAnalytics } from "../infrastructure/repositories/adminRepository.js"
import { removePostById, findPostById } from "../infrastructure/repositories/postRepository.js"
import { removeCommentById } from "../infrastructure/repositories/commentRepository.js"
import { findUserById, updateUserStatus } from "../infrastructure/repositories/userRepository.js"
import { isValidStatus } from "../domain/user.js"

/** GET /admin/stats — site-wide statistics (admin and superuser only) */
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  res.json(await getSiteStats())
}

/** GET /admin/users — per-user analytics (admin and superuser only) */
export const getUserStats = async (_req: Request, res: Response): Promise<void> => {
  res.json(await getUserAnalytics())
}

/** DELETE /admin/posts/:id — admin can delete any post regardless of who wrote it */
export const adminDeletePost = async (req: Request, res: Response): Promise<void> => {
  // "as string" tells TypeScript to trust that the route param is always a string
  const id = req.params.id as string

  const post = await findPostById(id)
  if (!post) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  await removePostById(id)
  res.json({ message: "Post deleted by admin" })
}

/** DELETE /admin/comments/:id — admin can delete any comment regardless of who wrote it */
export const adminDeleteComment = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string
  await removeCommentById(id)
  res.json({ message: "Comment deleted by admin" })
}

/**
 * PATCH /admin/users/:id/status — change a user's status (active / blocked / deleted).
 * This is how soft delete and account suspension work.
 * The user record stays in the database — only the status field changes.
 */
export const setUserStatus = async (req: Request, res: Response): Promise<void> => {
  const targetId = req.params.id as string
  const { status } = req.body as { status?: string }

  // HTTP input check — status must be present in the request body
  if (!status) {
    res.status(400).json({ message: "Status is required" })
    return
  }

  // Domain validation — status must be one of the allowed values
  if (!isValidStatus(status)) {
    res.status(400).json({ message: "Invalid status. Must be one of: active, blocked, deleted" })
    return
  }

  // Make sure the target user actually exists
  const target = await findUserById(targetId)
  if (!target) {
    res.status(404).json({ message: "User not found" })
    return
  }

  // Prevent admins from changing their own status — could lock themselves out
  if (target.id === req.user!.id) {
    res.status(403).json({ message: "You cannot change your own account status" })
    return
  }

  // Only superusers can change the status of other admins
  if (target.role === "admin" && req.user!.role !== "superuser") {
    res.status(403).json({ message: "Only a superuser can change an admin's status" })
    return
  }

  const updated = await updateUserStatus(targetId, status)
  res.json({ message: `User status updated to "${status}"`, user: updated })
}
