// controllers/comment.ts — handles adding, reading, editing, and deleting comments on posts.
// Only the comment's author (or an admin) can edit or delete it. Anyone who is
// logged in can add a comment; anyone can read them.

import type { Request, Response } from "express"
import {
  addNewComment,
  getCommentsByPostId,
  updateComment,
  removeCommentById
} from "../infrastructure/repositories/commentRepository.js"
import { createComment } from "../domain/comment.js"

/** POST /posts/:postId/comments — add a comment to a post */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  const { content } = req.body as { content?: string }

  // HTTP input check — content field must exist in the request body
  if (!content) {
    res.status(400).json({ message: "Comment content is required" })
    return
  }

  // createComment (domain factory) also rejects blank/whitespace-only content
  const comment = createComment(Date.now().toString(), req.params.postId as string, req.user!.id, content)

  res.status(201).json(await addNewComment(comment))
}

/** GET /posts/:postId/comments — return all comments for a post */
export const getCommentsByPost = async (req: Request, res: Response): Promise<void> => {
  res.json(await getCommentsByPostId(req.params.postId as string))
}

/** PUT /posts/:postId/comments/:commentId — edit a comment */
export const editComment = async (req: Request, res: Response): Promise<void> => {
  const comments = await getCommentsByPostId(req.params.postId as string)
  const comment = comments.find((c) => c.id === req.params.commentId)

  if (!comment) {
    res.status(404).json({ message: "Comment not found" })
    return
  }

  const user = req.user!
  if (comment.authorId !== user.id && user.role !== "superuser" && user.role !== "admin") {
    res.status(403).json({ message: "You do not have permission to edit this comment" })
    return
  }

  const { content } = req.body as { content?: string }

  // HTTP input check — can't update a comment to nothing
  if (!content || !content.trim()) {
    res.status(400).json({ message: "Comment content is required" })
    return
  }

  const updated = await updateComment(comment.id, content.trim())
  res.json(updated)
}

/** DELETE /posts/:postId/comments/:commentId — delete a comment */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const comments = await getCommentsByPostId(req.params.postId as string)
  const comment = comments.find((c) => c.id === req.params.commentId)

  if (!comment) {
    res.status(404).json({ message: "Comment not found" })
    return
  }

  const user = req.user!
  if (comment.authorId !== user.id && user.role !== "superuser" && user.role !== "admin") {
    res.status(403).json({ message: "You do not have permission to delete this comment" })
    return
  }

  await removeCommentById(comment.id)
  res.json({ message: "Comment deleted" })
}
