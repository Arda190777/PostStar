// Tests for middleware/jwt.ts — verifies token creation, verification, and expiry.

// The config is mocked so a test can change the token lifetime on the fly.
// The name must start with "mock" — jest.mock is hoisted above the imports,
// and only mock-prefixed variables are allowed inside its factory.
const mockConfig = { jwtSecret: "test-secret", jwtExpiresInSeconds: 3600 };

jest.mock("../../config/config.js", () => ({ config: mockConfig }));

import { createToken, verifyToken } from "../../middleware/jwt.js";

const payload = { id: "1", username: "alice", role: "user" };

beforeEach(() => {
  mockConfig.jwtSecret = "test-secret";
  mockConfig.jwtExpiresInSeconds = 3600;
});

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

  it("returns null when the token was signed with a different secret", () => {
    const token = createToken(payload);
    mockConfig.jwtSecret = "a-completely-different-secret";
    expect(verifyToken(token)).toBeNull();
  });
});

describe("token expiry", () => {
  it("rejects a token whose expiry has passed", () => {
    // A negative lifetime produces a token that expired before it was returned
    mockConfig.jwtExpiresInSeconds = -10;
    expect(verifyToken(createToken(payload))).toBeNull();
  });

  it("accepts a token that is still within its lifetime", () => {
    mockConfig.jwtExpiresInSeconds = 3600;
    expect(verifyToken(createToken(payload))).toMatchObject(payload);
  });

  it("rejects a token with no expiry claim at all", () => {
    // Mimics a token issued before expiry was added — it must not be trusted forever.
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

    const { createHmac } = require("crypto") as typeof import("crypto");
    const signature = createHmac("sha256", mockConfig.jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");

    expect(verifyToken(`${header}.${body}.${signature}`)).toBeNull();
  });

  it("rejects a token whose expiry was edited by the client", () => {
    const token = createToken(payload);
    const [header, body, signature] = token.split(".");

    // Push the expiry far into the future without re-signing — the signature
    // covers the payload, so this must fail verification.
    const claims = JSON.parse(
      Buffer.from(body as string, "base64url").toString(),
    ) as Record<string, unknown>;
    claims["exp"] = Math.floor(Date.now() / 1000) + 999999;

    const forgedBody = Buffer.from(JSON.stringify(claims)).toString("base64url");
    expect(verifyToken(`${header}.${forgedBody}.${signature}`)).toBeNull();
  });
});
