// ports/rest/routes/posts.routes.ts — defines all post, comment, and like endpoints.
// Everything that starts with /posts lives here. Public routes (reading posts and
// comments) don't need a token; write operations do. Mounted at /posts in index.ts.

import { Router } from "express"
import { createPost, getPosts, deletePost, editPost } from "../../../controllers/forum.js"
import { addComment, getCommentsByPost, editComment, deleteComment } from "../../../controllers/comment.js"
import { likePost } from "../../../controllers/like.js"
import { authenticate } from "../../../middleware/authenticate.js"

// All post, comment, and like routes live here (they all start with /posts)
const router = Router()

// --- Post routes ---

// GET /posts — get all posts (public)
router.get("/", getPosts)

// POST /posts — create a post (must be logged in)
router.post("/", authenticate, createPost)

// PUT /posts/:id — edit a post (must be logged in)
router.put("/:id", authenticate, editPost)

// DELETE /posts/:id — delete a post (must be logged in)
router.delete("/:id", authenticate, deletePost)

// --- Comment routes ---

// GET /posts/:postId/comments — get all comments on a post (public)
router.get("/:postId/comments", getCommentsByPost)

// POST /posts/:postId/comments — add a comment (must be logged in)
router.post("/:postId/comments", authenticate, addComment)

// PUT /posts/:postId/comments/:commentId — edit a comment (must be logged in)
router.put("/:postId/comments/:commentId", authenticate, editComment)

// DELETE /posts/:postId/comments/:commentId — delete a comment (must be logged in)
router.delete("/:postId/comments/:commentId", authenticate, deleteComment)

// --- Like routes ---

// POST /posts/:postId/like — like a post (must be logged in, once per user)
router.post("/:postId/like", authenticate, likePost)

export default router
