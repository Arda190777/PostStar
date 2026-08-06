// controllers/authorInfo.ts — turns the authorId stored on posts and comments
// into something a client can actually display.
//
// The database only records who wrote an item, not their name, because usernames
// could otherwise go stale in two places at once. So the name is looked up when
// the item is sent out. Everything here is response shaping, which is why it
// lives in the controller layer rather than in the domain.

import { findUsersByIds } from "../infrastructure/repositories/userRepository.js"

/** The public identity attached to a post or comment */
export interface AuthorInfo {
  id: string
  username: string
}

// Shown when an author id no longer matches any user. Accounts are soft-deleted
// rather than removed, so this is rare — but their posts must still render.
const UNKNOWN_AUTHOR = "[unknown]"

/**
 * Fetches every author named in a list of items using a single query.
 *
 * Looking each one up individually would mean one round trip per row, which
 * gets slow fast on a busy page.
 */
export const buildAuthorLookup = async (
  items: Array<{ authorId: string }>
): Promise<Map<string, AuthorInfo>> => {
  // Several posts usually share an author, so ask only for distinct ids
  const uniqueIds = [...new Set(items.map((item) => item.authorId))]
  const users = await findUsersByIds(uniqueIds)

  return new Map(users.map((user) => [user.id, { id: user.id, username: user.username }]))
}

/** Adds an `author` field to an item, keeping authorId in place for existing clients */
export const withAuthor = <T extends { authorId: string }>(
  item: T,
  lookup: Map<string, AuthorInfo>
): T & { author: AuthorInfo } => ({
  ...item,
  author: lookup.get(item.authorId) ?? { id: item.authorId, username: UNKNOWN_AUTHOR }
})
