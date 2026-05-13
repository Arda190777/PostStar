// Tests for domain/user.ts — verifies createUser rules and isValidStatus.
import { createUser, isValidStatus } from "../../domain/user.js";

describe("createUser", () => {
  it("creates a user with correct defaults", () => {
    const user = createUser("1", "alice", "password123");
    expect(user.role).toBe("user");
    expect(user.status).toBe("active");
  });

  it("throws when username is empty", () => {
    expect(() => createUser("1", "", "password123")).toThrow(
      "Username is required",
    );
  });

  it("throws when password is too short", () => {
    expect(() => createUser("1", "alice", "abc")).toThrow(
      "Password must be at least 6 characters",
    );
  });
});

describe("isValidStatus", () => {
  it("returns true for valid statuses", () => {
    expect(isValidStatus("active")).toBe(true);
    expect(isValidStatus("blocked")).toBe(true);
    expect(isValidStatus("deleted")).toBe(true);
  });

  it("returns false for an invalid status", () => {
    expect(isValidStatus("banned")).toBe(false);
  });
});
