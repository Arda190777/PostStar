// seed.ts — a one-time setup script that creates the first admin user in the database.
// Run it with: npm run seed
// Without this, there is no way to access the admin-only routes because the
// register endpoint always creates accounts with the "user" role.

import "dotenv/config"
import mongoose from "mongoose"
import { config } from "./config/config.js"
import { UserModel } from "./infrastructure/models/UserModel.js"

/**
 * Run this script once to create the first admin user.
 * Usage: npm run seed
 *
 * Change the username and password below before running.
 */
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log("Connected to MongoDB")

  const existing = await UserModel.findOne({ username: ADMIN_USERNAME })
  if (existing) {
    console.log(`User "${ADMIN_USERNAME}" already exists — skipping`)
    await mongoose.disconnect()
    return
  }

  await UserModel.create({
    id: Date.now().toString(),
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    role: "admin",
    status: "active"  // admin accounts start active like everyone else
  })

  console.log(`Admin user "${ADMIN_USERNAME}" created successfully`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
