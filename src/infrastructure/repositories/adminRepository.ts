// infrastructure/repositories/adminRepository.ts — read-only analytics queries for admins.
// Returns site-wide totals and per-user activity breakdowns. These are the only
// queries that span multiple collections at once (users, posts, comments, likes).

import type { SiteStats, UserAnalytic } from "../../ports/repositories/IAdminRepository.js"
import { UserModel } from "../models/UserModel.js"
import { PostModel } from "../models/PostModel.js"
import { CommentModel } from "../models/CommentModel.js"
import { LikeModel } from "../models/LikeModel.js"

/** Return aggregate counts across the whole site */
export const getSiteStats = async (): Promise<SiteStats> => ({
  totalUsers:    await UserModel.countDocuments(),
  totalPosts:    await PostModel.countDocuments(),
  totalComments: await CommentModel.countDocuments(),
  totalLikes:    await LikeModel.countDocuments()
})

/** Return per-user activity: post, comment, and like counts for each user */
export const getUserAnalytics = async (): Promise<UserAnalytic[]> => {
  const users = await UserModel.find().select("-_id id username role").lean()

  return Promise.all(
    users.map(async (user) => ({
      id:           user.id as string,
      username:     user.username,
      role:         user.role,
      postCount:    await PostModel.countDocuments({ authorId: user.id }),
      commentCount: await CommentModel.countDocuments({ authorId: user.id }),
      likeCount:    await LikeModel.countDocuments({ userId: user.id })
    }))
  )
}
