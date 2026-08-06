// config.ts — reads environment variables and exports them as a single object.
// Every part of the app that needs a setting (port, DB URL, JWT secret) imports
// from here instead of reading process.env directly. This means if a variable
// name ever changes, you fix it in one place.

// Used when JWT_SECRET is not set. Fine for local development, but anyone who
// reads this file could forge tokens — so production refuses to use it (see below).
const DEV_JWT_SECRET = "dev-only-insecure-secret"

const isProduction = process.env["NODE_ENV"] === "production"
const jwtSecret = process.env["JWT_SECRET"]

// Fail on startup rather than quietly running with a secret that is public
// knowledge. A forged token would let anyone log in as anyone, including an admin.
if (isProduction && !jwtSecret) {
  throw new Error("JWT_SECRET must be set when NODE_ENV=production")
}

export const config = {
  port: parseInt(process.env["PORT"] ?? "3000", 10),
  mongoUri: process.env["MONGODB_URI"] ?? "",
  jwtSecret: jwtSecret ?? DEV_JWT_SECRET,

  /**
   * How long a login token stays valid, in seconds (default 24 hours).
   * Tokens cannot be revoked once handed out, so they expire instead — that
   * caps how long a stolen token is useful to an attacker.
   */
  jwtExpiresInSeconds: parseInt(process.env["JWT_EXPIRES_IN_SECONDS"] ?? "86400", 10)
}
