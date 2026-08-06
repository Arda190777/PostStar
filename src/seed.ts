// seed.ts — a one-time setup script that creates the first admin user in the database.
// Run it with: npm run seed
// Without this, there is no way to access the admin-only routes because the
// register endpoint always creates accounts with the "user" role.

import "dotenv/config"
import mongoose from "mongoose"
import { config } from "./config/config.js"
import { UserModel } from "./infrastructure/models/UserModel.js"
import { createUser } from "./domain/user.js"

/**
 * Run this script once to create the first admin user.
 * Usage: npm run seed
 *
 * Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env to choose the credentials.
 * The defaults below are only meant for local development — change them before
 * running this against any database that other people can reach.
 */
const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] ?? "admin"
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin123"

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log("Connected to MongoDB")

  const existing = await UserModel.findOne({ username: ADMIN_USERNAME })
  if (existing) {
    console.log(`User "${ADMIN_USERNAME}" already exists — skipping`)
    await mongoose.disconnect()
    return
  }

  // Build through the domain factory so the password gets hashed the same way
  // registration does — the seeded admin must not be the one account whose
  // password sits readable in the database.
  // Admin accounts start active like everyone else.
  await UserModel.create(createUser(Date.now().toString(), ADMIN_USERNAME, ADMIN_PASSWORD, "admin"))

  console.log(`Admin user "${ADMIN_USERNAME}" created successfully`)

  if (!process.env["ADMIN_PASSWORD"]) {
    console.warn('Warning: seeded with the default password — set ADMIN_PASSWORD in .env and re-seed for anything but local use')
  }
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
