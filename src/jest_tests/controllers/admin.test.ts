// Tests for controllers/admin.ts — verifies admin stats, delete, and status change.
import type { Request, Response } from "express";
import {
  getStats,
  adminDeletePost,
  setUserStatus,
} from "../../controllers/admin.js";

jest.mock("../../infrastructure/repositories/adminRepository.js", () => ({
  getSiteStats: jest.fn(),
  getUserAnalytics: jest.fn(),
}));

jest.mock("../../infrastructure/repositories/postRepository.js", () => ({
  findPostById: jest.fn(),
  removePostById: jest.fn(),
}));

jest.mock("../../infrastructure/repositories/commentRepository.js", () => ({
  removeCommentById: jest.fn(),
}));

jest.mock("../../infrastructure/repositories/userRepository.js", () => ({
  findUserById: jest.fn(),
  updateUserStatus: jest.fn(),
}));

import * as adminRepo from "../../infrastructure/repositories/adminRepository.js";
import * as postRepo from "../../infrastructure/repositories/postRepository.js";
import * as userRepo from "../../infrastructure/repositories/userRepository.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const admin = { id: "admin-1", username: "admin", role: "admin" };
const user = {
  id: "user-1",
  username: "alice",
  password: "password123",
  role: "user" as const,
  status: "active" as const,
};
const post = {
  id: "post-1",
  title: "Hello",
  content: "World",
  authorId: "user-1",
  likes: 0,
  createdAt: "",
};

beforeEach(() => jest.clearAllMocks());

describe("getStats", () => {
  it("returns site stats", async () => {
    const stats = {
      totalUsers: 1,
      totalPosts: 1,
      totalComments: 1,
      totalLikes: 1,
    };
    jest.mocked(adminRepo.getSiteStats).mockResolvedValue(stats);
    const res = mockRes();
    await getStats({} as Request, res);
    expect(res.json).toHaveBeenCalledWith(stats);
  });
});

describe("adminDeletePost", () => {
  it("returns 404 when post does not exist", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(undefined);
    const res = mockRes();
    await adminDeletePost(
      { params: { id: "post-1" }, user: admin } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deletes the post successfully", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(post);
    jest.mocked(postRepo.removePostById).mockResolvedValue(undefined);
    const res = mockRes();
    await adminDeletePost(
      { params: { id: "post-1" }, user: admin } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Post deleted by admin" });
  });
});

describe("setUserStatus", () => {
  it("returns 400 for an invalid status", async () => {
    const res = mockRes();
    await setUserStatus(
      {
        body: { status: "banned" },
        params: { id: "user-1" },
        user: admin,
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 403 when admin tries to change their own status", async () => {
    jest
      .mocked(userRepo.findUserById)
      .mockResolvedValue({ ...user, id: "admin-1" });
    const res = mockRes();
    await setUserStatus(
      {
        body: { status: "blocked" },
        params: { id: "admin-1" },
        user: admin,
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("updates the status successfully", async () => {
    jest.mocked(userRepo.findUserById).mockResolvedValue(user);
    jest
      .mocked(userRepo.updateUserStatus)
      .mockResolvedValue({ ...user, status: "blocked" });
    const res = mockRes();
    await setUserStatus(
      {
        body: { status: "blocked" },
        params: { id: "user-1" },
        user: admin,
      } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User status updated to "blocked"' }),
    );
  });
});
