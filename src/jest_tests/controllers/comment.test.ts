// Tests for controllers/comment.ts — verifies comment creation, listing, and deletion.
import type { Request, Response } from "express";
import {
  addComment,
  getCommentsByPost,
  deleteComment,
} from "../../controllers/comment.js";

jest.mock("../../infrastructure/repositories/commentRepository.js", () => ({
  addNewComment: jest.fn(),
  getCommentsByPostId: jest.fn(),
  updateComment: jest.fn(),
  removeCommentById: jest.fn(),
}));

import * as commentRepo from "../../infrastructure/repositories/commentRepository.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const user = { id: "user-1", username: "alice", role: "user" };
const comment = {
  id: "comment-1",
  postId: "post-1",
  authorId: "user-1",
  content: "Nice!",
  createdAt: "",
};

beforeEach(() => jest.clearAllMocks());

describe("addComment", () => {
  it("returns 400 when content is missing", async () => {
    const res = mockRes();
    await addComment(
      { body: {}, params: { postId: "post-1" }, user } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 201 on success", async () => {
    jest.mocked(commentRepo.addNewComment).mockResolvedValue(comment);
    const res = mockRes();
    await addComment(
      {
        body: { content: "Nice!" },
        params: { postId: "post-1" },
        user,
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("getCommentsByPost", () => {
  it("returns all comments for a post", async () => {
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([comment]);
    const res = mockRes();
    await getCommentsByPost(
      { params: { postId: "post-1" } } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith([comment]);
  });
});

describe("deleteComment", () => {
  it("returns 404 when comment does not exist", async () => {
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([]);
    const res = mockRes();
    await deleteComment(
      {
        params: { postId: "post-1", commentId: "comment-1" },
        user,
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deletes successfully when user is the owner", async () => {
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([comment]);
    jest.mocked(commentRepo.removeCommentById).mockResolvedValue(undefined);
    const res = mockRes();
    await deleteComment(
      {
        params: { postId: "post-1", commentId: "comment-1" },
        user,
      } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Comment deleted" });
  });
});
