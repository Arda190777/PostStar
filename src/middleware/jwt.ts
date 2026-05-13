// middleware/jwt.ts — creates and verifies JSON Web Tokens (JWTs).
// JWTs are how the API knows who is making a request without hitting the
// database on every call. The token is signed with a secret key so it can't
// be faked. This file uses a custom HMAC-SHA256 implementation instead of
// an external library.

import { createHmac } from "crypto"
import { config } from "../config/config.js"

// Data stored inside the JWT payload
export interface JwtPayload {
  id: string
  username: string
  role: string
}

// Base64URL encode (replaces + → - and / → _ and removes =)
const toBase64Url = (str: string): string =>
  Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

// Base64URL decode
const fromBase64Url = (str: string): string =>
  Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()

// Sign data with HMAC-SHA256
const sign = (data: string): string =>
  createHmac("sha256", config.jwtSecret).update(data).digest("base64url")

/** Creates a signed JWT token from the given payload */
export const createToken = (payload: JwtPayload): string => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = toBase64Url(JSON.stringify(payload))
  const signature = sign(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

/** Verifies a JWT token; returns the payload if valid, null otherwise */
export const verifyToken = (token: string): JwtPayload | null => {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [header, body, signature] = parts as [string, string, string]
  const expected = sign(`${header}.${body}`)

  // Signature mismatch → invalid token
  if (signature !== expected) return null

  try {
    return JSON.parse(fromBase64Url(body)) as JwtPayload
  } catch {
    return null
  }
}
