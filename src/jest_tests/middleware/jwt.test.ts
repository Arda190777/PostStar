// Tests for middleware/jwt.ts — verifies token creation and verification logic.
import { createToken, verifyToken } from "../../middleware/jwt.js";

const payload = { id: "1", username: "alice", role: "user" };

describe("createToken / verifyToken", () => {
  it("creates a token that can be verified", () => {
    const token = createToken(payload);
    expect(verifyToken(token)).toMatchObject(payload);
  });

  it("returns null for a tampered token", () => {
    const token = createToken(payload);
    const [h, b] = token.split(".");
    expect(verifyToken(`${h}.${b}.badsignature`)).toBeNull();
  });

  it("returns null for a malformed token", () => {
    expect(verifyToken("not.a.valid.token")).toBeNull();
  });
});
