// Tests for domain/comment.ts — verifies createComment enforces content rules.
import { createComment } from "../../domain/comment.js";

describe("createComment", () => {
  it("creates a comment with correct fields", () => {
    const comment = createComment("1", "post-1", "user-1", "Great post!");
    expect(comment.content).toBe("Great post!");
    expect(comment.postId).toBe("post-1");
  });

  it("throws when content is empty", () => {
    expect(() => createComment("1", "post-1", "user-1", "")).toThrow(
      "Comment content is required",
    );
  });
});
