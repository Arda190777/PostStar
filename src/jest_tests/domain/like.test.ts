// Tests for domain/like.ts — verifies createLike requires both IDs.
import { createLike } from "../../domain/like.js";

describe("createLike", () => {
  it("creates a like with correct fields", () => {
    expect(createLike("post-1", "user-1")).toEqual({
      postId: "post-1",
      userId: "user-1",
    });
  });

  it("throws when postId is empty", () => {
    expect(() => createLike("", "user-1")).toThrow("Post ID is required");
  });
});
