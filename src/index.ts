// index.ts — the entry point of the entire application.
// This is where everything gets wired together: Express is created, middleware
// is applied, routes are mounted, and the server starts listening. Nothing runs
// until the database connection succeeds, so if MongoDB is unreachable the
// server won't start at all.

import "dotenv/config" // Load .env variables FIRST before anything else reads them
import express, { type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import { config } from "./config/config.js"
import { connectDatabase } from "./infrastructure/database.js"

// Route files — each file groups related endpoints together
import authRoutes from "./ports/rest/routes/auth.routes.js"
import postsRoutes from "./ports/rest/routes/posts.routes.js"
import adminRoutes from "./ports/rest/routes/admin.routes.js"

const app = express()

// Allow requests from other origins (needed for frontend apps)
app.use(cors())

// Parse incoming JSON request bodies
app.use(express.json())

// Serve the static UI from the public folder
app.use(express.static("public"))

// Health check — just confirms the server is alive
app.get("/api", (_req, res) => {
  res.send("Forum API is running")
})

// Mount route groups
app.use("/auth", authRoutes)   // /auth/register, /auth/login
app.use("/posts", postsRoutes) // /posts, /posts/:id, /posts/:postId/comments, /posts/:postId/like
app.use("/admin", adminRoutes) // /admin/stats, /admin/users, /admin/posts/:id, /admin/comments/:id

/**
 * Global error handler — catches any unhandled error thrown anywhere in the app.
 * For example, if a domain factory function throws (e.g. "Password too short"),
 * it ends up here and gets returned as a clean JSON error instead of crashing the server.
 * Express recognises this as an error handler because it has 4 parameters (err, req, res, next).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Something went wrong"
  res.status(400).json({ message })
})

// Connect to MongoDB first, then start the server
connectDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running at http://localhost:${config.port}`)
    })
  })
  .catch((err: unknown) => {
    console.error("Failed to connect to MongoDB:", err)
    process.exit(1) // Crash hard so the problem is obvious
  })
