// Tests for domain/post.ts — verifies createPost enforces title and content rules.
import { createPost } from "../../domain/post.js";

describe("createPost", () => {
  it("creates a post with likes set to 0", () => {
    const post = createPost("1", "Title", "Content", "user-1");
    expect(post.likes).toBe(0);
    expect(post.title).toBe("Title");
  });

  it("throws when title is empty", () => {
    expect(() => createPost("1", "", "Content", "user-1")).toThrow(
      "Post title is required",
    );
  });

  it("throws when content is empty", () => {
    expect(() => createPost("1", "Title", "", "user-1")).toThrow(
      "Post content is required",
    );
  });
});
