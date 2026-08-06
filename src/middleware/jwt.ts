// middleware/jwt.ts — creates and verifies JSON Web Tokens (JWTs).
// JWTs are how the API knows who is making a request without hitting the
// database on every call. The token is signed with a secret key so it can't
// be faked. This file uses a custom HMAC-SHA256 implementation instead of
// an external library.

import { createHmac, timingSafeEqual } from "crypto"
import { config } from "../config/config.js"

// Data stored inside the JWT payload
export interface JwtPayload {
  id: string
  username: string
  role: string
}

/**
 * What actually travels inside the token: the payload plus two standard
 * JWT timestamps, both in seconds since 1970 (not milliseconds).
 *
 * iat — "issued at", when the token was created
 * exp — "expires", the moment the token stops being accepted
 */
interface SignedPayload extends JwtPayload {
  iat: number
  exp: number
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

/** Current time in seconds — the unit JWT timestamps use */
const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

/** Creates a signed JWT token from the given payload */
export const createToken = (payload: JwtPayload): string => {
  const issuedAt = nowInSeconds()

  // Stamp an expiry into the token itself. Because it sits inside the signed
  // section, changing it invalidates the signature — a client cannot extend
  // its own token's lifetime.
  const claims: SignedPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + config.jwtExpiresInSeconds
  }

  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = toBase64Url(JSON.stringify(claims))
  const signature = sign(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

/** Verifies a JWT token; returns the payload if valid, null if invalid or expired */
export const verifyToken = (token: string): JwtPayload | null => {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [header, body, signature] = parts as [string, string, string]
  const expected = sign(`${header}.${body}`)

  // Signature mismatch → the token was tampered with or signed with another key
  if (!safeEqual(signature, expected)) return null

  let claims: SignedPayload
  try {
    claims = JSON.parse(fromBase64Url(body)) as SignedPayload
  } catch {
    return null
  }

  // Reject anything past its expiry. A token with no exp at all was issued by
  // an older version of this code, and is treated as invalid rather than
  // trusted forever — those clients simply log in again.
  if (typeof claims.exp !== "number" || claims.exp <= nowInSeconds()) return null

  return { id: claims.id, username: claims.username, role: claims.role }
}

/**
 * Constant-time string comparison.
 *
 * A plain `!==` stops as soon as it finds a difference, so a wrong signature
 * that shares its first few characters is rejected marginally slower. An
 * attacker can measure those timing differences to reconstruct a valid
 * signature one character at a time. timingSafeEqual always takes the same
 * time regardless of where the difference is.
 */
const safeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)

  // timingSafeEqual throws unless both sides are the same length. Length alone
  // does not reveal anything useful here — every valid signature is the same size.
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}
