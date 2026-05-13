// ports/repositories/IUserRepository.ts — the contract (interface) that the
// user repository must follow. By defining this here, the rest of the app depends
// on the contract, not on the actual MongoDB implementation. This makes it easy
// to swap the database later without touching any other code.

import type { User, UserStatus } from "../../domain/user.js"

/** Output Port — contract the infrastructure layer must fulfil for user data operations */
export interface IUserRepository {
  /** Persist a new user and return it */
  addUser(user: User): Promise<User>

  /** Look up a user by exact username and password match — only returns active users */
  findUserByUsernameAndPassword(username: string, password: string): Promise<User | undefined>

  /** Find a user by username (used for duplicate check during registration) */
  findUserByUsername(username: string): Promise<User | undefined>

  /** Find a user by their id */
  findUserById(id: string): Promise<User | undefined>

  /** Change a user's status (active / blocked / deleted) — soft delete lives here */
  updateUserStatus(id: string, status: UserStatus): Promise<User | undefined>
}
