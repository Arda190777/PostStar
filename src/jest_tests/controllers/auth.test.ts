// Tests for controllers/auth.ts — verifies register and login HTTP responses.
import type { Request, Response } from "express";
import { register, login } from "../../controllers/auth.js";

jest.mock("../../infrastructure/repositories/userRepository.js", () => ({
  addUser: jest.fn(),
  findUserByUsernameAndPassword: jest.fn(),
  findUserByUsername: jest.fn(),
}));

import * as userRepo from "../../infrastructure/repositories/userRepository.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const validUser = {
  id: "1",
  username: "alice",
  password: "password123",
  role: "user" as const,
  status: "active" as const,
};

beforeEach(() => jest.clearAllMocks());

describe("register", () => {
  it("returns 400 when fields are missing", async () => {
    const res = mockRes();
    await register({ body: {} } as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 409 when username is taken", async () => {
    jest.mocked(userRepo.findUserByUsername).mockResolvedValue(validUser);
    const res = mockRes();
    await register(
      { body: { username: "alice", password: "password123" } } as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("returns 201 on success", async () => {
    jest.mocked(userRepo.findUserByUsername).mockResolvedValue(undefined);
    jest.mocked(userRepo.addUser).mockResolvedValue(validUser);
    const res = mockRes();
    await register(
      { body: { username: "alice", password: "password123" } } as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("login", () => {
  it("returns 400 when fields are missing", async () => {
    const res = mockRes();
    await login({ body: {} } as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 when credentials are wrong", async () => {
    jest
      .mocked(userRepo.findUserByUsernameAndPassword)
      .mockResolvedValue(undefined);
    jest.mocked(userRepo.findUserByUsername).mockResolvedValue(undefined);
    const res = mockRes();
    await login(
      { body: { username: "alice", password: "wrong" } } as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns token on success", async () => {
    jest
      .mocked(userRepo.findUserByUsernameAndPassword)
      .mockResolvedValue(validUser);
    const res = mockRes();
    await login(
      { body: { username: "alice", password: "password123" } } as Request,
      res,
    );
    const response = (res.json as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(response).toHaveProperty("token");
  });
});
