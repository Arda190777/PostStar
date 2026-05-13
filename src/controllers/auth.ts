// controllers/auth.ts — handles user registration and login.
// It reads the HTTP request, validates the input, calls the repository to
// check or save the user, then returns a JWT token the client uses for all
// future requests that require authentication.

import type { Request, Response } from "express"
import { addUser, findUserByUsernameAndPassword, findUserByUsername } from "../infrastructure/repositories/userRepository.js"
import { createToken } from "../middleware/jwt.js"
import { createUser } from "../domain/user.js"

/** POST /auth/register — create a new user account */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string }

  // HTTP input check — make sure the request actually included both fields
  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" })
    return
  }

  // Check the username isn't already taken before creating anything
  if (await findUserByUsername(username)) {
    res.status(409).json({ message: "Username is already taken" })
    return
  }

  // createUser enforces domain rules (e.g. password min length) — throws if invalid
  const user = createUser(Date.now().toString(), username, password)

  const newUser = await addUser(user)
  const token = createToken({ id: newUser.id, username: newUser.username, role: newUser.role })

  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role } })
}

/** POST /auth/login — validate credentials and return a JWT */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string }

  // HTTP input check — both fields must be present
  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" })
    return
  }

  // findUserByUsernameAndPassword only returns users whose status is "active".
  // If it returns nothing, the credentials are wrong OR the account is not active.
  const user = await findUserByUsernameAndPassword(username, password)

  if (!user) {
    // Check if the username exists at all — if it does, the account may be blocked or deleted
    const existing = await findUserByUsername(username)

    if (existing && existing.status === "blocked") {
      res.status(403).json({ message: "Your account has been blocked. Contact an administrator." })
      return
    }

    if (existing && existing.status === "deleted") {
      res.status(403).json({ message: "This account no longer exists." })
      return
    }

    // Username not found or password wrong — keep the message vague for security
    res.status(401).json({ message: "Invalid username or password" })
    return
  }

  const token = createToken({ id: user.id, username: user.username, role: user.role })
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
}
