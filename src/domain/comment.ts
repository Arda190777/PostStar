// domain/comment.ts — defines what a Comment is in this application.
// Comments belong to a post and an author. A comment can also be a reply to
// another comment, which is what makes the discussion threaded. The factory
// function enforces that a comment can never be saved with empty content.

export interface Comment {
  id: string
  postId: string
  authorId: string
  content: string

  /**
   * The comment this one replies to, or null for a top-level comment.
   * Following parentId upwards from any reply eventually reaches a top-level
   * comment — that chain is the thread.
   */
  parentId: string | null

  createdAt: string // ISO timestamp
}

/**
 * How deeply replies may nest, counting a top-level comment as depth 1.
 *
 * Without a limit a client could chain replies indefinitely, producing threads
 * that no screen can display sensibly and that recursive rendering has to walk
 * one level at a time. Deep replies are pushed back to the last allowed level
 * rather than rejected — see assertReplyDepth in the controller.
 */
export const MAX_REPLY_DEPTH = 5

/**
 * Factory function — the ONLY correct way to create a Comment object.
 * An empty comment should never reach the database.
 *
 * `parentId` defaults to null, so existing callers that only post top-level
 * comments keep working unchanged.
 */
export function createComment(
  id: string,
  postId: string,
  authorId: string,
  content: string,
  parentId: string | null = null
): Comment {
  // A comment with no text is useless — reject it
  if (!content || !content.trim()) throw new Error("Comment content is required")

  // A comment cannot be its own parent — that would create a loop with no
  // top-level comment at the end of it
  if (parentId !== null && parentId === id) throw new Error("A comment cannot reply to itself")

  return {
    id,
    postId,
    authorId,
    content: content.trim(),
    parentId,
    createdAt: new Date().toISOString()
  }
}

/**
 * Collects a comment together with every reply beneath it, at any depth.
 *
 * Deleting a comment has to take its replies with it — otherwise they would
 * point at a parent that no longer exists and the thread would break apart.
 * Returns the ids to remove, starting with the comment itself.
 */
export function collectThreadIds(rootId: string, comments: Comment[]): string[] {
  // Group replies by the comment they answer, so each level is one lookup
  const childrenOf = new Map<string, Comment[]>()

  for (const comment of comments) {
    if (comment.parentId === null) continue
    const siblings = childrenOf.get(comment.parentId)
    if (siblings) siblings.push(comment)
    else childrenOf.set(comment.parentId, [comment])
  }

  const collected: string[] = []
  const queue = [rootId]

  // Walk down level by level. `collected` doubles as the visited list, so a
  // malformed loop in the data cannot spin here forever.
  while (queue.length > 0) {
    const id = queue.shift()!
    if (collected.includes(id)) continue

    collected.push(id)
    for (const child of childrenOf.get(id) ?? []) queue.push(child.id)
  }

  return collected
}

/**
 * Works out how deep a comment sits, counting a top-level comment as 1.
 * Used to stop replies nesting past MAX_REPLY_DEPTH.
 */
export function depthOf(comment: Comment, byId: Map<string, Comment>): number {
  let depth = 1
  let current = comment

  // Stop at MAX_REPLY_DEPTH + 1: past that the answer no longer changes any
  // decision, and the ceiling guarantees this ends even on looped data.
  while (current.parentId !== null && depth <= MAX_REPLY_DEPTH + 1) {
    const parent = byId.get(current.parentId)
    if (!parent) break // parent is gone — treat what is left as a top-level chain

    current = parent
    depth++
  }

  return depth
}

/** A comment with its direct replies nested underneath it */
export interface CommentNode extends Comment {
  replies: CommentNode[]
}

/**
 * Rearranges a flat list of comments into reply threads.
 *
 * The database stores comments as a flat collection where each one points at
 * its parent. This walks that list once, hangs every reply under its parent,
 * and returns only the top-level comments — each carrying its replies.
 *
 * A reply whose parent is missing (for example if the parent was deleted by an
 * older version of the code) is treated as top-level rather than dropped, so a
 * broken link can never make a comment disappear.
 */
export function buildCommentTree(comments: Comment[]): CommentNode[] {
  // Oldest first, so a conversation reads top to bottom
  const ordered = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  // Every comment gets an empty replies list first, so a parent can be found
  // regardless of whether it appears before or after its replies in the list.
  const nodes = new Map<string, CommentNode>(
    ordered.map((comment) => [comment.id, { ...comment, replies: [] }])
  )

  const roots: CommentNode[] = []

  for (const comment of ordered) {
    const node = nodes.get(comment.id)!
    const parent = comment.parentId === null ? undefined : nodes.get(comment.parentId)

    if (parent) parent.replies.push(node)
    else roots.push(node)
  }

  return roots
}
