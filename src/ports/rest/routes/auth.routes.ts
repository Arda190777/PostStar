// ports/rest/routes/auth.routes.ts — defines the public authentication endpoints.
// These routes don't require a token because they're how users get their token
// in the first place. Mounted at /auth in index.ts.

import { Router } from "express"
import { register, login } from "../../../controllers/auth.js"

// All routes here are public — no login needed
const router = Router()

// POST /auth/register — create a new account
router.post("/register", register)

// POST /auth/login — sign in and get a JWT token
router.post("/login", login)

export default router
