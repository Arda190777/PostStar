// infrastructure/models/LikeModel.ts — tells Mongoose what a Like document
// looks like in MongoDB. The compound unique index on (postId + userId) enforces
// at the database level that a user can only like any given post once, even if
// the controller check is somehow bypassed.

import mongoose from "mongoose"

/**
 * Mongoose schema for a Like.
 * The compound unique index prevents a user from liking the same post twice.
 */
const likeSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true }
  },
  { versionKey: false }
)

// Prevent duplicate likes at the database level
likeSchema.index({ postId: 1, userId: 1 }, { unique: true })

export const LikeModel = mongoose.model("Like", likeSchema)
