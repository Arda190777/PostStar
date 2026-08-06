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
import { buildAuthorLookup, withAuthor } from "./authorInfo.js"

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
  const saved = await addPost(post)

  // The author is whoever is logged in, so their name is already known here —
  // no need to look it up again.
  const author = { id: req.user!.id, username: req.user!.username }

  res.status(201).json({ ...saved, author })
}

/** GET /posts — return all posts, newest first, each with its author's name */
export const getPosts = async (_req: Request, res: Response): Promise<void> => {
  const posts = await getAllPosts()
  const authors = await buildAuthorLookup(posts)

  // Newest first — createdAt is an ISO timestamp, so plain string ordering works
  const newestFirst = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  res.json(newestFirst.map((post) => withAuthor(post, authors)))
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
