// infrastructure/repositories/commentRepository.ts — all database operations for comments.
// This is the only file in the app that talks directly to the CommentModel (MongoDB).
// Controllers never touch Mongoose directly — they always go through these functions.

import type { Comment } from "../../domain/comment.js"
import { CommentModel } from "../models/CommentModel.js"

/** Persist a new comment and return it */
export const addNewComment = async (comment: Comment): Promise<Comment> => {
  await CommentModel.create(comment)
  return comment
}

/** Return all comments for a given post */
export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  const docs = await CommentModel.find({ postId }).select("-_id").lean()
  return docs as unknown as Comment[]
}

/** Update a comment's content; returns undefined if not found */
export const updateComment = async (
  id: string,
  content: string
): Promise<Comment | undefined> => {
  const doc = await CommentModel.findOneAndUpdate(
    { id },
    { content },
    { new: true }
  ).select("-_id").lean()
  return doc ? (doc as unknown as Comment) : undefined
}

/** Find a single comment by id, or undefined if not found */
export const findCommentById = async (id: string): Promise<Comment | undefined> => {
  const doc = await CommentModel.findOne({ id }).select("-_id").lean()
  return doc ? (doc as unknown as Comment) : undefined
}

/** Remove a comment by id (no-op if not found) */
export const removeCommentById = async (id: string): Promise<void> => {
  await CommentModel.deleteOne({ id })
}

/**
 * Remove several comments at once (no-op for ids that don't exist).
 * Used to delete a comment together with all of its replies in one operation.
 */
export const removeCommentsByIds = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return
  await CommentModel.deleteMany({ id: { $in: ids } })
}
