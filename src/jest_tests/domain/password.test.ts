// Tests for domain/password.ts — verifies hashing, verification, and the
// legacy plain-text path used when migrating old accounts.
import { hashPassword, isHashed, verifyPassword } from "../../domain/password.js";

describe("hashPassword", () => {
  it("does not store the plain-text password", () => {
    const hash = hashPassword("password123");
    expect(hash).not.toContain("password123");
  });

  it("produces a different hash each time, even for the same password", () => {
    // Each hash gets its own random salt, so identical passwords must not
    // produce identical stored values.
    expect(hashPassword("password123")).not.toBe(hashPassword("password123"));
  });

  it("marks its output as hashed", () => {
    expect(isHashed(hashPassword("password123"))).toBe(true);
  });
});

describe("verifyPassword", () => {
  it("accepts the correct password", () => {
    const hash = hashPassword("password123");
    expect(verifyPassword("password123", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashPassword("password123");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects a password that is a prefix of the real one", () => {
    const hash = hashPassword("password123");
    expect(verifyPassword("password", hash)).toBe(false);
  });

  it("rejects a hash with a tampered digest", () => {
    const [prefix, salt] = hashPassword("password123").split(":");
    const forged = `${prefix}:${salt}:${"0".repeat(128)}`;
    expect(verifyPassword("password123", forged)).toBe(false);
  });

  it("rejects a malformed hash instead of throwing", () => {
    expect(verifyPassword("password123", "scrypt:only-a-salt")).toBe(false);
    expect(verifyPassword("password123", "scrypt:salt:tooshort")).toBe(false);
  });
});

describe("legacy plain-text passwords", () => {
  it("is not treated as hashed", () => {
    expect(isHashed("password123")).toBe(false);
  });

  it("still verifies, so old accounts can log in and be upgraded", () => {
    expect(verifyPassword("password123", "password123")).toBe(true);
  });

  it("rejects a wrong password against a plain-text value", () => {
    expect(verifyPassword("wrong", "password123")).toBe(false);
  });
});
