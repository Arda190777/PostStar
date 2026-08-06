// domain/password.ts — turns a plain-text password into something safe to store.
//
// Passwords must never be written to the database as-is: anyone who gets a copy
// of the database would instantly own every account. Instead we store a one-way
// hash. Hashing is easy to do forwards and practically impossible to reverse,
// so the stored value is useless to an attacker but still lets us check a login.
//
// We use scrypt from Node's built-in crypto module. It is deliberately slow and
// memory-hungry, which makes brute-forcing guesses expensive. Like middleware/jwt.ts,
// this avoids an external library and relies only on the standard library.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

// Marks a stored value as produced by this file, so we can tell hashes apart
// from old plain-text passwords left over from before hashing existed.
const PREFIX = "scrypt"

// Length of the random salt, in bytes
const SALT_BYTES = 16

// Length of the derived hash, in bytes
const KEY_BYTES = 64

/**
 * Hashes a plain-text password for storage.
 *
 * Every call generates a fresh random salt, so two users with the same password
 * still get completely different stored values. That stops an attacker from
 * spotting shared passwords or reusing precomputed lookup tables.
 *
 * Returns a single string in the format: scrypt:<salt-hex>:<hash-hex>
 * Keeping the salt alongside the hash means we only need one database column.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = scryptSync(plain, salt, KEY_BYTES).toString("hex")
  return `${PREFIX}:${salt}:${derived}`
}

/** True if the stored value was produced by hashPassword (rather than being legacy plain text) */
export function isHashed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}:`)
}

/**
 * Checks a plain-text password against a stored value.
 *
 * Handles both formats:
 *  - a scrypt hash → re-hash the attempt with the stored salt and compare
 *  - legacy plain text → compare directly, so accounts created before hashing
 *    existed can still log in (login then upgrades them, see userRepository)
 *
 * Comparisons use timingSafeEqual, which always takes the same amount of time
 * regardless of how many characters match. A normal `===` returns faster the
 * sooner it finds a difference, and an attacker can measure that to guess a
 * value one character at a time.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!isHashed(stored)) return safeEqual(Buffer.from(plain), Buffer.from(stored))

  const [, salt, derived] = stored.split(":")

  // A hash missing its salt or digest is corrupt — never treat that as a match
  if (!salt || !derived) return false

  const expected = Buffer.from(derived, "hex")

  // Guard against a truncated or malformed digest before deriving a key from it
  if (expected.length !== KEY_BYTES) return false

  return safeEqual(expected, scryptSync(plain, salt, KEY_BYTES))
}

/** Constant-time buffer comparison — timingSafeEqual requires both sides to be the same length */
function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b)
}
