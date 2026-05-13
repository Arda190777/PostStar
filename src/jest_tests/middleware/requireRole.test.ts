// Tests for middleware/requireRole.ts — verifies role-based access control.
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "../../middleware/requireRole.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("requireRole", () => {
  it("returns 403 when user has the wrong role", () => {
    const req = { user: { role: "user" } } as unknown as Request;
    const res = mockRes();
    requireRole("admin")(req, res, jest.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next() when user has the correct role", () => {
    const req = { user: { role: "admin" } } as unknown as Request;
    const next = jest.fn();
    requireRole("admin")(req, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalled();
  });
});
