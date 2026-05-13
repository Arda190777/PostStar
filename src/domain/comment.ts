// domain/comment.ts — defines what a Comment is in this application.
// Comments belong to a post and an author. The factory function enforces that
// a comment can never be saved with empty content.

export interface Comment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string // ISO timestamp
}

/**
 * Factory function — the ONLY correct way to create a Comment object.
 * An empty comment should never reach the database.
 */
export function createComment(id: string, postId: string, authorId: string, content: string): Comment {
  // A comment with no text is useless — reject it
  if (!content || !content.trim()) throw new Error("Comment content is required")

  return { id, postId, authorId, content: content.trim(), createdAt: new Date().toISOString() }
}
