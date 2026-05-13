// domain/user.ts — defines what a User is in this application.
// This is the purest layer — no database, no HTTP, just the data shape and the
// rules that must always be true (e.g. username can't be empty, password must
// be at least 6 characters). If a User can't be created here, it can't exist anywhere.

export type Role = "user" | "admin" | "superuser"

/**
 * The three possible states a user account can be in.
 * We never delete users from the database — we just change their status.
 * This is called "soft delete" — the data stays, the access doesn't.
 *
 * active  — normal account, can log in
 * blocked — account is suspended, cannot log in (but can be reactivated)
 * deleted — account is marked as gone, cannot log in (soft delete)
 */
export type UserStatus = "active" | "blocked" | "deleted"

export interface User {
  id: string
  username: string
  password: string
  role: Role
  status: UserStatus
}

/**
 * Factory function — the ONLY correct way to create a User object.
 * This enforces the rules that must always be true for a User to exist.
 * If any rule is broken, it throws an error before the bad data ever reaches the database.
 */
export function createUser(id: string, username: string, password: string, role: Role = "user"): User {
  // A user without a username makes no sense — reject it immediately
  if (!username || !username.trim()) throw new Error("Username is required")

  // Minimum password length — short passwords are too easy to guess
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters")

  // Every new user starts as active — only an admin can change this later
  return { id, username: username.trim(), password, role, status: "active" }
}

/**
 * Validates that a given string is a real UserStatus value.
 * Used by the admin controller before saving a status change to the database.
 */
export function isValidStatus(value: string): value is UserStatus {
  return value === "active" || value === "blocked" || value === "deleted"
}
