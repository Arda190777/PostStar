// infrastructure/repositories/likeRepository.ts — all database operations for likes.
// This is the only file in the app that talks directly to the LikeModel (MongoDB).
// Includes saving a like, checking for duplicates, and fetching all likes on a post.

import type { Like } from "../../domain/like.js"
import { LikeModel } from "../models/LikeModel.js"

/** Persist a new like and return it */
export const addLike = async (like: Like): Promise<Like> => {
  await LikeModel.create(like)
  return like
}

/** Return true if the user has already liked the post */
export const hasUserLikedPost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  const doc = await LikeModel.exists({ postId, userId })
  return doc !== null
}

