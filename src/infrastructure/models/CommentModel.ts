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
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
)

export const CommentModel = mongoose.model("Comment", commentSchema)
