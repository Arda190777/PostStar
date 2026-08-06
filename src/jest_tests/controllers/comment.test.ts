// Tests for controllers/comment.ts — verifies comment creation, replies,
// threaded listing, and deletion (which takes replies with it).
import type { Request, Response } from "express";
import {
  addComment,
  getCommentsByPost,
  deleteComment,
} from "../../controllers/comment.js";
import { MAX_REPLY_DEPTH, type Comment } from "../../domain/comment.js";

jest.mock("../../infrastructure/repositories/commentRepository.js", () => ({
  addNewComment: jest.fn(),
  getCommentsByPostId: jest.fn(),
  updateComment: jest.fn(),
  removeCommentById: jest.fn(),
  removeCommentsByIds: jest.fn(),
}));

// Listing comments looks up author names, which reaches the user repository
jest.mock("../../infrastructure/repositories/userRepository.js", () => ({
  findUsersByIds: jest.fn().mockResolvedValue([]),
}));

import * as commentRepo from "../../infrastructure/repositories/commentRepository.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const user = { id: "user-1", username: "alice", role: "user" };

/** Builds a comment fixture; parentId defaults to null (a top-level comment) */
const makeComment = (
  id: string,
  parentId: string | null = null,
  createdAt = "2026-01-01T00:00:00.000Z",
): Comment => ({
  id,
  postId: "post-1",
  authorId: "user-1",
  content: `content of ${id}`,
  parentId,
  createdAt,
});

const comment = makeComment("comment-1");

/** Reads the payload the controller passed to res.json */
const jsonBody = (res: Response) =>
  (res.json as jest.Mock).mock.calls[0]?.[0] as unknown;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([]);
  jest.mocked(commentRepo.removeCommentsByIds).mockResolvedValue(undefined);
});

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

  it("stores a top-level comment with no parent", async () => {
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

    const saved = jest.mocked(commentRepo.addNewComment).mock
      .calls[0]?.[0] as Comment;
    expect(saved.parentId).toBeNull();
  });
});

describe("replies", () => {
  it("saves a reply pointing at its parent", async () => {
    jest
      .mocked(commentRepo.getCommentsByPostId)
      .mockResolvedValue([makeComment("parent-1")]);
    jest.mocked(commentRepo.addNewComment).mockResolvedValue(comment);

    const res = mockRes();
    await addComment(
      {
        body: { content: "I agree", parentId: "parent-1" },
        params: { postId: "post-1" },
        user,
      } as unknown as Request,
      res,
    );

    const saved = jest.mocked(commentRepo.addNewComment).mock
      .calls[0]?.[0] as Comment;
    expect(saved.parentId).toBe("parent-1");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 404 when the parent does not exist", async () => {
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([]);

    const res = mockRes();
    await addComment(
      {
        body: { content: "I agree", parentId: "nope" },
        params: { postId: "post-1" },
        user,
      } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(commentRepo.addNewComment).not.toHaveBeenCalled();
  });

  it("returns 404 when the parent belongs to a different post", async () => {
    // getCommentsByPostId only returns this post's comments, so a parent from
    // another post is simply not found.
    jest
      .mocked(commentRepo.getCommentsByPostId)
      .mockResolvedValue([makeComment("other-post-comment")]);

    const res = mockRes();
    await addComment(
      {
        body: { content: "I agree", parentId: "comment-on-post-2" },
        params: { postId: "post-1" },
        user,
      } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("stops nesting past the depth limit instead of rejecting the reply", async () => {
    // Build a chain c1 -> c2 -> ... exactly MAX_REPLY_DEPTH levels deep
    const chain: Comment[] = [];
    for (let level = 1; level <= MAX_REPLY_DEPTH; level++) {
      chain.push(makeComment(`c${level}`, level === 1 ? null : `c${level - 1}`));
    }
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue(chain);
    jest.mocked(commentRepo.addNewComment).mockResolvedValue(comment);

    const res = mockRes();
    await addComment(
      {
        body: { content: "too deep", parentId: `c${MAX_REPLY_DEPTH}` },
        params: { postId: "post-1" },
        user,
      } as unknown as Request,
      res,
    );

    // Accepted, but attached one level up so it lands at the deepest allowed level
    expect(res.status).toHaveBeenCalledWith(201);
    const saved = jest.mocked(commentRepo.addNewComment).mock
      .calls[0]?.[0] as Comment;
    expect(saved.parentId).toBe(`c${MAX_REPLY_DEPTH - 1}`);
  });
});

describe("getCommentsByPost", () => {
  it("returns top-level comments with replies nested underneath", async () => {
    jest
      .mocked(commentRepo.getCommentsByPostId)
      .mockResolvedValue([
        makeComment("root", null, "2026-01-01T00:00:00.000Z"),
        makeComment("reply", "root", "2026-01-02T00:00:00.000Z"),
      ]);

    const res = mockRes();
    await getCommentsByPost(
      { params: { postId: "post-1" } } as unknown as Request,
      res,
    );

    const body = jsonBody(res) as Array<{
      id: string;
      replies: Array<{ id: string }>;
    }>;

    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe("root");
    expect(body[0]?.replies.map((r) => r.id)).toEqual(["reply"]);
  });

  it("includes an author on every comment in the thread", async () => {
    jest
      .mocked(commentRepo.getCommentsByPostId)
      .mockResolvedValue([
        makeComment("root"),
        makeComment("reply", "root", "2026-01-02T00:00:00.000Z"),
      ]);

    const res = mockRes();
    await getCommentsByPost(
      { params: { postId: "post-1" } } as unknown as Request,
      res,
    );

    const body = jsonBody(res) as Array<{
      author: { username: string };
      replies: Array<{ author: { username: string } }>;
    }>;

    expect(body[0]?.author).toBeDefined();
    expect(body[0]?.replies[0]?.author).toBeDefined();
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
    const res = mockRes();
    await deleteComment(
      {
        params: { postId: "post-1", commentId: "comment-1" },
        user,
      } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: "Comment deleted",
      deletedCount: 1,
    });
  });

  it("deletes the replies along with the comment", async () => {
    jest
      .mocked(commentRepo.getCommentsByPostId)
      .mockResolvedValue([
        makeComment("comment-1"),
        makeComment("reply-1", "comment-1"),
        makeComment("reply-2", "reply-1"),
        makeComment("unrelated"),
      ]);

    const res = mockRes();
    await deleteComment(
      {
        params: { postId: "post-1", commentId: "comment-1" },
        user,
      } as unknown as Request,
      res,
    );

    const removed = jest.mocked(commentRepo.removeCommentsByIds).mock
      .calls[0]?.[0] as string[];

    expect(removed.sort()).toEqual(["comment-1", "reply-1", "reply-2"]);
    expect(removed).not.toContain("unrelated");
  });

  it("returns 403 when another user tries to delete the comment", async () => {
    jest.mocked(commentRepo.getCommentsByPostId).mockResolvedValue([comment]);
    const res = mockRes();
    await deleteComment(
      {
        params: { postId: "post-1", commentId: "comment-1" },
        user: { id: "user-2", username: "bob", role: "user" },
      } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(commentRepo.removeCommentsByIds).not.toHaveBeenCalled();
  });
});
