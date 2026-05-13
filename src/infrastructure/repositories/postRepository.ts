// infrastructure/repositories/postRepository.ts — all database operations for posts.
// This is the only file in the app that talks directly to the PostModel (MongoDB).
// Includes finding, creating, updating, deleting, and incrementing like counts.

import type { Post } from "../../domain/post.js"
import { PostModel } from "../models/PostModel.js"

/** Persist a new post and return it */
export const addPost = async (post: Post): Promise<Post> => {
  await PostModel.create(post)
  return post
}

/** Return all posts */
export const getAllPosts = async (): Promise<Post[]> => {
  const docs = await PostModel.find().select("-_id").lean()
  return docs as unknown as Post[]
}

/** Remove a post by id (no-op if not found) */
export const removePostById = async (id: string): Promise<void> => {
  await PostModel.deleteOne({ id })
}

/** Find a single post by id, or undefined if not found */
export const findPostById = async (id: string): Promise<Post | undefined> => {
  const doc = await PostModel.findOne({ id }).select("-_id").lean()
  return doc ? (doc as unknown as Post) : undefined
}

/** Update a post's title and content; returns undefined if not found */
export const updatePost = async (
  id: string,
  title: string,
  content: string
): Promise<Post | undefined> => {
  const doc = await PostModel.findOneAndUpdate(
    { id },
    { title, content },
    { new: true }
  ).select("-_id").lean()
  return doc ? (doc as unknown as Post) : undefined
}

/** Increment the like counter of a post by 1 */
export const increasePostLikeCount = async (id: string): Promise<void> => {
  await PostModel.updateOne({ id }, { $inc: { likes: 1 } })
}
