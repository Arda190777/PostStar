// config.ts — reads environment variables and exports them as a single object.
// Every part of the app that needs a setting (port, DB URL, JWT secret) imports
// from here instead of reading process.env directly. This means if a variable
// name ever changes, you fix it in one place.

export const config = {
  port: parseInt(process.env["PORT"] ?? "3000", 10),
  mongoUri: process.env["MONGODB_URI"] ?? "",
  jwtSecret: process.env["JWT_SECRET"] ?? "fallback-secret"
}
