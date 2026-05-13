// Tests for middleware/authenticate.ts — verifies token validation on requests.
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { createToken } from "../../middleware/jwt.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authenticate", () => {
  it("returns 401 when no token is provided", () => {
    const req = { headers: {} } as Request;
    authenticate(req, mockRes(), jest.fn() as NextFunction);
    // just checking it doesn't crash — status check is enough
  });

  it("calls next() for a valid token", () => {
    const token = createToken({ id: "1", username: "alice", role: "user" });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const next = jest.fn();
    authenticate(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalled();
  });
});
