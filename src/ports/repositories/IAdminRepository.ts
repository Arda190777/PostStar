// ports/repositories/IAdminRepository.ts — the contract (interface) for admin analytics.
// Also defines the SiteStats and UserAnalytic types used across the admin feature.
// Keeping them here means any file that needs these types imports from one place.

/** Site-wide aggregate statistics */
export interface SiteStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalLikes: number
}

/** Per-user activity summary */
export interface UserAnalytic {
  id: string
  username: string
  role: string
  postCount: number
  commentCount: number
  likeCount: number
}

/** Output Port — contract the infrastructure layer must fulfil for admin/analytics operations */
export interface IAdminRepository {
  /** Return aggregate counts across the whole site */
  getSiteStats(): Promise<SiteStats>

  /** Return an activity summary for every user */
  getUserAnalytics(): Promise<UserAnalytic[]>
}
