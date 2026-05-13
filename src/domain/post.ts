// domain/post.ts — defines what a Post is in this application.
// A post must always have a non-empty title and content — those rules live here
// in the factory function so no other layer can accidentally save a blank post.

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  likes: number
  createdAt: string // ISO timestamp
}

/**
 * Factory function — the ONLY correct way to create a Post object.
 * A post with no title or no content should never exist in the system.
 */
export function createPost(id: string, title: string, content: string, authorId: string): Post {
  // A post with no title is meaningless — reject it
  if (!title || !title.trim()) throw new Error("Post title is required")

  // A post with no content is meaningless — reject it
  if (!content || !content.trim()) throw new Error("Post content is required")

  return {
    id,
    title: title.trim(),
    content: content.trim(),
    authorId,
    likes: 0,
    createdAt: new Date().toISOString()
  }
}
