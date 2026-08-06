// controllers/comment.ts — handles adding, reading, editing, and deleting comments on posts.
// Only the comment's author (or an admin) can edit or delete it. Anyone who is
// logged in can add a comment; anyone can read them.
//
// Comments are threaded: a comment may reply to another comment, and reading
// them back returns each reply nested under the comment it answers.

import type { Request, Response } from "express"
import {
  addNewComment,
  getCommentsByPostId,
  updateComment,
  removeCommentsByIds
} from "../infrastructure/repositories/commentRepository.js"
import {
  createComment,
  buildCommentTree,
  collectThreadIds,
  depthOf,
  MAX_REPLY_DEPTH,
  type Comment,
  type CommentNode
} from "../domain/comment.js"
import { buildAuthorLookup, withAuthor, type AuthorInfo } from "./authorInfo.js"

/** POST /posts/:postId/comments — add a comment, or reply to one via parentId */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  const { content, parentId } = req.body as { content?: string; parentId?: string }
  const postId = req.params.postId as string

  // HTTP input check — content field must exist in the request body
  if (!content) {
    res.status(400).json({ message: "Comment content is required" })
    return
  }

  let effectiveParentId: string | null = null

  if (parentId) {
    const existing = await getCommentsByPostId(postId)
    const byId = new Map(existing.map((comment) => [comment.id, comment]))
    const parent = byId.get(parentId)

    // Looking the parent up among this post's comments also rejects replying
    // to a comment that lives on a different post.
    if (!parent) {
      res.status(404).json({ message: "Parent comment not found on this post" })
      return
    }

    effectiveParentId = limitDepth(parent, byId)
  }

  // createComment (domain factory) also rejects blank/whitespace-only content
  const comment = createComment(
    Date.now().toString(),
    postId,
    req.user!.id,
    content,
    effectiveParentId
  )

  const saved = await addNewComment(comment)

  // The author is whoever is logged in, so their name is already known here
  res.status(201).json({ ...saved, author: { id: req.user!.id, username: req.user!.username } })
}

/** GET /posts/:postId/comments — return the post's comments as reply threads */
export const getCommentsByPost = async (req: Request, res: Response): Promise<void> => {
  const comments = await getCommentsByPostId(req.params.postId as string)
  const authors = await buildAuthorLookup(comments)

  res.json(attachAuthors(buildCommentTree(comments), authors))
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

/** DELETE /posts/:postId/comments/:commentId — delete a comment and its replies */
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

  // Replies go with their parent — leaving them behind would orphan the thread
  const removed = collectThreadIds(comment.id, comments)
  await removeCommentsByIds(removed)

  res.json({ message: "Comment deleted", deletedCount: removed.length })
}

/**
 * Picks the parent a new reply should actually hang from.
 *
 * Normally that is the comment being replied to. Once a thread reaches
 * MAX_REPLY_DEPTH, further replies attach to the deepest allowed ancestor
 * instead, so the conversation keeps going without nesting any further.
 */
const limitDepth = (parent: Comment, byId: Map<string, Comment>): string => {
  // The new comment sits one level below the comment it replies to
  if (depthOf(parent, byId) + 1 <= MAX_REPLY_DEPTH) return parent.id

  // Climb back up until a reply placed under this ancestor fits within the limit
  let ancestor = parent
  while (depthOf(ancestor, byId) + 1 > MAX_REPLY_DEPTH && ancestor.parentId !== null) {
    const next = byId.get(ancestor.parentId)
    if (!next) break

    ancestor = next
  }

  return ancestor.id
}

/** Adds author details to every comment in a tree, replies included */
const attachAuthors = (
  nodes: CommentNode[],
  authors: Map<string, AuthorInfo>
): Array<CommentNode & { author: AuthorInfo }> =>
  nodes.map((node) => ({
    ...withAuthor(node, authors),
    replies: attachAuthors(node.replies, authors)
  }))
