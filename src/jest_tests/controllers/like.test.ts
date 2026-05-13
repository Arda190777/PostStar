// Tests for controllers/like.ts — verifies liking a post and duplicate prevention.
import type { Request, Response } from "express";
import { likePost } from "../../controllers/like.js";

jest.mock("../../infrastructure/repositories/likeRepository.js", () => ({
  addLike: jest.fn(),
  hasUserLikedPost: jest.fn(),
}));

jest.mock("../../infrastructure/repositories/postRepository.js", () => ({
  findPostById: jest.fn(),
  increasePostLikeCount: jest.fn(),
}));

import * as likeRepo from "../../infrastructure/repositories/likeRepository.js";
import * as postRepo from "../../infrastructure/repositories/postRepository.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const user = { id: "user-1", username: "alice", role: "user" };
const post = {
  id: "post-1",
  title: "Hello",
  content: "World",
  authorId: "user-1",
  likes: 0,
  createdAt: "",
};

beforeEach(() => jest.clearAllMocks());

describe("likePost", () => {
  it("returns 404 when post does not exist", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(undefined);
    const res = mockRes();
    await likePost(
      { params: { postId: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 400 when post is already liked", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(post);
    jest.mocked(likeRepo.hasUserLikedPost).mockResolvedValue(true);
    const res = mockRes();
    await likePost(
      { params: { postId: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("likes the post successfully", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(post);
    jest.mocked(likeRepo.hasUserLikedPost).mockResolvedValue(false);
    jest
      .mocked(likeRepo.addLike)
      .mockResolvedValue({ postId: "post-1", userId: "user-1" });
    jest.mocked(postRepo.increasePostLikeCount).mockResolvedValue(undefined);
    const res = mockRes();
    await likePost(
      { params: { postId: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Post liked" });
  });
});
