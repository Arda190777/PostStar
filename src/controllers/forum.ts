// controllers/forum.ts — handles creating, reading, editing, and deleting posts.
// It checks that the user is the post owner (or an admin) before allowing edits
// or deletes. Regular users can only touch their own posts.

import type { Request, Response } from "express"
import {
  addPost,
  getAllPosts,
  removePostById,
  updatePost,
  findPostById
} from "../infrastructure/repositories/postRepository.js"
import { createPost as buildPost } from "../domain/post.js"

/** POST /posts — create a new forum post */
export const createPost = async (req: Request, res: Response): Promise<void> => {
  const { title, content } = req.body as { title?: string; content?: string }

  // HTTP input check — both fields must be present in the request body
  if (!title || !content) {
    res.status(400).json({ message: "Title and content are required" })
    return
  }

  // buildPost (domain factory) enforces that title and content are not just whitespace
  const post = buildPost(Date.now().toString(), title, content, req.user!.id)

  res.status(201).json(await addPost(post))
}

/** GET /posts — return all posts */
export const getPosts = async (_req: Request, res: Response): Promise<void> => {
  res.json(await getAllPosts())
}

/** DELETE /posts/:id — delete a post (owner, superuser, or admin only) */
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  const post = await findPostById(req.params.id as string)

  if (!post) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  const user = req.user!
  if (post.authorId !== user.id && user.role !== "superuser" && user.role !== "admin") {
    res.status(403).json({ message: "You do not have permission to delete this post" })
    return
  }

  await removePostById(post.id)
  res.json({ message: "Post deleted" })
}

/** PUT /posts/:id — edit a post (owner, superuser, or admin only) */
export const editPost = async (req: Request, res: Response): Promise<void> => {
  const post = await findPostById(req.params.id as string)

  if (!post) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  const user = req.user!
  if (post.authorId !== user.id && user.role !== "superuser" && user.role !== "admin") {
    res.status(403).json({ message: "You do not have permission to edit this post" })
    return
  }

  const { title, content } = req.body as { title?: string; content?: string }

  // HTTP input check — can't update a post with empty fields
  if (!title || !content) {
    res.status(400).json({ message: "Title and content are required" })
    return
  }

  // Extra guard — don't allow saving a post that is just blank spaces
  if (!title.trim() || !content.trim()) {
    res.status(400).json({ message: "Title and content cannot be blank" })
    return
  }

  const updated = await updatePost(post.id, title.trim(), content.trim())
  res.json(updated)
}
