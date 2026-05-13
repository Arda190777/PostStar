// controllers/like.ts — handles liking a post.
// Each user can only like any given post once. It also verifies the post exists
// before saving the like, so you can't like something that has been deleted.

import type { Request, Response } from "express"
import { addLike, hasUserLikedPost } from "../infrastructure/repositories/likeRepository.js"
import { findPostById, increasePostLikeCount } from "../infrastructure/repositories/postRepository.js"
import { createLike } from "../domain/like.js"

/** POST /posts/:postId/like — like a post (each user can only like once) */
export const likePost = async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.postId as string
  const userId = req.user!.id

  // Make sure the post actually exists before trying to like it
  // Without this check, you could like a post that was already deleted
  const post = await findPostById(postId)
  if (!post) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  // Prevent the same user from liking the same post more than once
  if (await hasUserLikedPost(postId, userId)) {
    res.status(400).json({ message: "You have already liked this post" })
    return
  }

  // createLike (domain factory) validates both IDs are present
  const like = createLike(postId, userId)
  await addLike(like)
  await increasePostLikeCount(postId)

  res.json({ message: "Post liked" })
}
