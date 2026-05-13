// ports/repositories/ICommentRepository.ts — the contract (interface) that the
// comment repository must follow. Defines every database operation available for
// comments so the rest of the app never depends directly on MongoDB or Mongoose.

import type { Comment } from "../../domain/comment.js"

/** Output Port — contract the infrastructure layer must fulfil for comment data operations */
export interface ICommentRepository {
  /** Persist a new comment and return it */
  addNewComment(comment: Comment): Promise<Comment>

  /** Return all comments for a given post */
  getCommentsByPostId(postId: string): Promise<Comment[]>

  /** Update a comment's content; returns undefined if not found */
  updateComment(id: string, content: string): Promise<Comment | undefined>

  /** Remove a comment by id (no-op if not found) */
  removeCommentById(id: string): Promise<void>
}
