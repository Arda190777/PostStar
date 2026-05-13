// infrastructure/repositories/userRepository.ts — all database operations for users.
// This is the only file in the app that talks directly to the UserModel (MongoDB).
// Everything else goes through these functions, keeping database logic in one place.

import type { User, UserStatus } from "../../domain/user.js"
import { UserModel } from "../models/UserModel.js"

/** Persist a new user and return it */
export const addUser = async (user: User): Promise<User> => {
  await UserModel.create(user)
  return user
}

/**
 * Find a user by username and password — but ONLY if their account is active.
 * Blocked and deleted users are treated as if they don't exist during login.
 */
export const findUserByUsernameAndPassword = async (
  username: string,
  password: string
): Promise<User | undefined> => {
  const doc = await UserModel.findOne({ username, password, status: "active" }).select("-_id").lean()
  return doc ? (doc as unknown as User) : undefined
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
