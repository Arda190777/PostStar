// Tests for controllers/forum.ts — verifies post creation, listing, and deletion.
import type { Request, Response } from "express";
import { createPost, getPosts, deletePost } from "../../controllers/forum.js";

jest.mock("../../infrastructure/repositories/postRepository.js", () => ({
  addPost: jest.fn(),
  getAllPosts: jest.fn(),
  removePostById: jest.fn(),
  findPostById: jest.fn(),
  updatePost: jest.fn(),
}));

// Listing posts looks up author names, which reaches the user repository
jest.mock("../../infrastructure/repositories/userRepository.js", () => ({
  findUsersByIds: jest.fn(),
}));

import * as postRepo from "../../infrastructure/repositories/postRepository.js";
import * as userRepo from "../../infrastructure/repositories/userRepository.js";

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

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(userRepo.findUsersByIds).mockResolvedValue([
    { id: "user-1", username: "alice" },
  ]);
});

describe("createPost", () => {
  it("returns 400 when fields are missing", async () => {
    const res = mockRes();
    await createPost({ body: {}, user } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 201 on success", async () => {
    jest.mocked(postRepo.addPost).mockResolvedValue(post);
    const res = mockRes();
    await createPost(
      {
        body: { title: "Hello", content: "World" },
        user,
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("getPosts", () => {
  it("returns all posts, each carrying its author's name", async () => {
    jest.mocked(postRepo.getAllPosts).mockResolvedValue([post]);
    const res = mockRes();
    await getPosts({} as Request, res);
    expect(res.json).toHaveBeenCalledWith([
      { ...post, author: { id: "user-1", username: "alice" } },
    ]);
  });

  it("returns the newest post first", async () => {
    const older = { ...post, id: "old", createdAt: "2026-01-01T00:00:00.000Z" };
    const newer = { ...post, id: "new", createdAt: "2026-06-01T00:00:00.000Z" };
    jest.mocked(postRepo.getAllPosts).mockResolvedValue([older, newer]);

    const res = mockRes();
    await getPosts({} as Request, res);

    const body = (res.json as jest.Mock).mock.calls[0]?.[0] as Array<{
      id: string;
    }>;
    expect(body.map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("falls back to a placeholder when the author no longer exists", async () => {
    jest.mocked(userRepo.findUsersByIds).mockResolvedValue([]);
    jest.mocked(postRepo.getAllPosts).mockResolvedValue([post]);

    const res = mockRes();
    await getPosts({} as Request, res);

    const body = (res.json as jest.Mock).mock.calls[0]?.[0] as Array<{
      author: { username: string };
    }>;
    expect(body[0]?.author.username).toBe("[unknown]");
  });
});

describe("deletePost", () => {
  it("returns 404 when post does not exist", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(undefined);
    const res = mockRes();
    await deletePost(
      { params: { id: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deletes successfully when user is the owner", async () => {
    jest.mocked(postRepo.findPostById).mockResolvedValue(post);
    jest.mocked(postRepo.removePostById).mockResolvedValue(undefined);
    const res = mockRes();
    await deletePost(
      { params: { id: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Post deleted" });
  });
});
