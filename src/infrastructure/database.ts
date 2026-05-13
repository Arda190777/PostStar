// infrastructure/database.ts — opens the connection to MongoDB Atlas.
// Called once at startup in index.ts. If the connection fails, the server
// refuses to start so you never end up with a running API that silently
// can't read or write data.

import mongoose from "mongoose"
import { config } from "../config/config.js"

/**
 * Opens the Mongoose connection to MongoDB Atlas.
 * Call this once at startup (in index.ts) before the server begins listening.
 */
export const connectDatabase = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables")
  }

  await mongoose.connect(config.mongoUri)
  console.log("Connected to MongoDB")
}
