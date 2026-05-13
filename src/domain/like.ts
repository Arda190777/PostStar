// domain/like.ts — defines what a Like is in this application.
// A like is just a link between a post and a user. The factory function ensures
// both IDs are always present before anything gets saved.

export interface Like {
  postId: string
  userId: string
}

/**
 * Factory function — the ONLY correct way to create a Like object.
 * Both IDs are required — a like with no post or no user makes no sense.
 */
export function createLike(postId: string, userId: string): Like {
  if (!postId) throw new Error("Post ID is required to create a like")
  if (!userId) throw new Error("User ID is required to create a like")
  return { postId, userId }
}
