// infrastructure/repositories/userRepository.ts — all database operations for users.
// This is the only file in the app that talks directly to the UserModel (MongoDB).
// Everything else goes through these functions, keeping database logic in one place.

import type { User, UserStatus } from "../../domain/user.js"
import { hashPassword, isHashed, verifyPassword } from "../../domain/password.js"
import { UserModel } from "../models/UserModel.js"

/** Persist a new user and return it */
export const addUser = async (user: User): Promise<User> => {
  await UserModel.create(user)
  return user
}

/**
 * Find a user by username and password — but ONLY if their account is active.
 * Blocked and deleted users are treated as if they don't exist during login.
 *
 * Passwords are stored hashed, and the same password produces a different hash
 * every time (each one gets its own random salt). That means we cannot ask
 * MongoDB to match on the password directly — we look the user up by username
 * and then verify the password in code.
 */
export const findUserByUsernameAndPassword = async (
  username: string,
  password: string
): Promise<User | undefined> => {
  const doc = await UserModel.findOne({ username, status: "active" }).select("-_id").lean()
  if (!doc) return undefined

  const user = doc as unknown as User
  if (!verifyPassword(password, user.password)) return undefined

  // Accounts created before hashing existed still hold a plain-text password.
  // A correct login is the only moment we know the real password, so that is
  // when we replace it with a hash. After one login the account is fully migrated.
  if (!isHashed(user.password)) {
    const upgraded = hashPassword(password)
    await UserModel.updateOne({ id: user.id }, { password: upgraded })
    user.password = upgraded
  }

  return user
}

/** Find a user by username (used for duplicate check during registration) */
export const findUserByUsername = async (
  username: string
): Promise<User | undefined> => {
  const doc = await UserModel.findOne({ username }).select("-_id").lean()
  return doc ? (doc as unknown as User) : undefined
}

/** Find a single user by their id, or undefined if not found */
export const findUserById = async (id: string): Promise<User | undefined> => {
  const doc = await UserModel.findOne({ id }).select("-_id").lean()
  return doc ? (doc as unknown as User) : undefined
}

/**
 * Change a user's status (active / blocked / deleted).
 * This is how soft delete and account suspension work — we never remove the document.
 */
export const updateUserStatus = async (
  id: string,
  status: UserStatus
): Promise<User | undefined> => {
  const doc = await UserModel.findOneAndUpdate(
    { id },
    { status },
    { new: true }
  ).select("-_id").lean()
  return doc ? (doc as unknown as User) : undefined
}
