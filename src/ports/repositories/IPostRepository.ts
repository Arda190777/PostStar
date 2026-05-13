// ports/repositories/IPostRepository.ts — the contract (interface) that the
// post repository must follow. Defines every database operation available for
// posts so the rest of the app never depends directly on MongoDB or Mongoose.

import type { Post } from "../../domain/post.js"

/** Output Port — contract the infrastructure layer must fulfil for post data operations */
export interface IPostRepository {
  /** Persist a new post and return it */
  addPost(post: Post): Promise<Post>

  /** Return every stored post */
  getAllPosts(): Promise<Post[]>

  /** Remove a post by id (no-op if not found) */
  removePostById(id: string): Promise<void>

  /** Find a single post by id, or undefined if not found */
  findPostById(id: string): Promise<Post | undefined>

  /** Update a post's title and content; returns undefined if not found */
  updatePost(id: string, title: string, content: string): Promise<Post | undefined>

  /** Increment the like counter of a post by 1 */
  increasePostLikeCount(id: string): Promise<void>
}
