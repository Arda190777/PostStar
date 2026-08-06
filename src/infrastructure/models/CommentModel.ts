// infrastructure/models/CommentModel.ts — tells Mongoose what a Comment document
// looks like in MongoDB. Every comment is linked to a post (postId) and an author
// (authorId). It is the only place in the app that knows about MongoDB's document
// structure for comments.

import mongoose from "mongoose"

/**
 * Mongoose schema for a Comment.
 */
const commentSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true },
    postId:    { type: String, required: true },
    authorId:  { type: String, required: true },
    content:   { type: String, required: true },

    // The comment this one replies to. null means it is a top-level comment.
    // Defaulting to null means comments saved before threading existed read
    // back as top-level instead of undefined.
    parentId:  { type: String, default: null },

    createdAt: { type: String, required: true }
  },
  { versionKey: false }
)

// Every comment lookup is "all comments on this post", so index that field
commentSchema.index({ postId: 1 })

export const CommentModel = mongoose.model("Comment", commentSchema)
