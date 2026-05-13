// infrastructure/models/PostModel.ts — tells Mongoose what a Post document
// looks like in MongoDB. Defines field types, required fields, and defaults
// (likes starts at 0). It is the only place in the app that knows about
// MongoDB's document structure for posts.

import mongoose from "mongoose"

/**
 * Mongoose schema for a Post.
 */
const postSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true },
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    authorId:  { type: String, required: true },
    likes:     { type: Number, default: 0 },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
)

export const PostModel = mongoose.model("Post", postSchema)
