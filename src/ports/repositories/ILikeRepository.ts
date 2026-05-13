// ports/repositories/ILikeRepository.ts — the contract (interface) that the
// like repository must follow. Defines every database operation available for
// likes so the rest of the app never depends directly on MongoDB or Mongoose.

import type { Like } from "../../domain/like.js"

/** Output Port — contract the infrastructure layer must fulfil for like data operations */
export interface ILikeRepository {
  /** Persist a new like and return it */
  addLike(like: Like): Promise<Like>

  /** Return true if the user has already liked the post */
  hasUserLikedPost(postId: string, userId: string): Promise<boolean>

}
