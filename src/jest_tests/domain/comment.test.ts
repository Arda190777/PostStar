// Tests for domain/comment.ts — verifies createComment rules and the threading
// helpers that turn a flat comment list into reply threads.
import {
  createComment,
  buildCommentTree,
  collectThreadIds,
  depthOf,
  MAX_REPLY_DEPTH,
  type Comment,
} from "../../domain/comment.js";

/** Builds a comment fixture; parentId defaults to null (a top-level comment) */
const makeComment = (
  id: string,
  parentId: string | null = null,
  createdAt = `2026-01-01T00:00:0${id.length}.000Z`,
): Comment => ({
  id,
  postId: "post-1",
  authorId: "user-1",
  content: `content of ${id}`,
  parentId,
  createdAt,
});

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

  it("defaults to a top-level comment", () => {
    expect(createComment("1", "post-1", "user-1", "Hi").parentId).toBeNull();
  });

  it("records the parent when given one", () => {
    const reply = createComment("2", "post-1", "user-1", "Hi", "1");
    expect(reply.parentId).toBe("1");
  });

  it("refuses to let a comment reply to itself", () => {
    expect(() => createComment("1", "post-1", "user-1", "Hi", "1")).toThrow(
      "A comment cannot reply to itself",
    );
  });
});

describe("buildCommentTree", () => {
  it("returns top-level comments with replies nested underneath", () => {
    const tree = buildCommentTree([
      makeComment("root"),
      makeComment("reply", "root"),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("root");
    expect(tree[0]?.replies.map((r) => r.id)).toEqual(["reply"]);
  });

  it("nests replies to replies", () => {
    const tree = buildCommentTree([
      makeComment("a"),
      makeComment("b", "a"),
      makeComment("c", "b"),
    ]);

    expect(tree[0]?.replies[0]?.replies[0]?.id).toBe("c");
  });

  it("hangs a reply under its parent even when it comes first in the list", () => {
    // The database returns no particular order, so parents may appear last
    const tree = buildCommentTree([
      makeComment("reply", "root"),
      makeComment("root"),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("root");
  });

  it("keeps a reply whose parent is missing instead of dropping it", () => {
    const tree = buildCommentTree([makeComment("orphan", "long-gone")]);

    expect(tree.map((c) => c.id)).toEqual(["orphan"]);
  });

  it("orders comments oldest first", () => {
    const tree = buildCommentTree([
      makeComment("newer", null, "2026-06-01T00:00:00.000Z"),
      makeComment("older", null, "2026-01-01T00:00:00.000Z"),
    ]);

    expect(tree.map((c) => c.id)).toEqual(["older", "newer"]);
  });

  it("returns an empty list when there are no comments", () => {
    expect(buildCommentTree([])).toEqual([]);
  });
});

describe("collectThreadIds", () => {
  const thread = [
    makeComment("root"),
    makeComment("child-1", "root"),
    makeComment("child-2", "root"),
    makeComment("grandchild", "child-1"),
    makeComment("unrelated"),
  ];

  it("collects a comment together with every reply beneath it", () => {
    expect(collectThreadIds("root", thread).sort()).toEqual(
      ["child-1", "child-2", "grandchild", "root"].sort(),
    );
  });

  it("leaves unrelated comments alone", () => {
    expect(collectThreadIds("root", thread)).not.toContain("unrelated");
  });

  it("collects only the comment itself when it has no replies", () => {
    expect(collectThreadIds("unrelated", thread)).toEqual(["unrelated"]);
  });

  it("collects a partial thread when starting from the middle", () => {
    expect(collectThreadIds("child-1", thread).sort()).toEqual([
      "child-1",
      "grandchild",
    ]);
  });

  it("terminates on comments that point at each other in a loop", () => {
    // Should never happen, but a corrupt record must not hang the server
    const looped = [makeComment("x", "y"), makeComment("y", "x")];
    expect(collectThreadIds("x", looped).sort()).toEqual(["x", "y"]);
  });
});

describe("depthOf", () => {
  const chain = [
    makeComment("l1"),
    makeComment("l2", "l1"),
    makeComment("l3", "l2"),
  ];
  const byId = new Map(chain.map((c) => [c.id, c]));

  it("counts a top-level comment as depth 1", () => {
    expect(depthOf(chain[0] as Comment, byId)).toBe(1);
  });

  it("counts each nesting level", () => {
    expect(depthOf(chain[1] as Comment, byId)).toBe(2);
    expect(depthOf(chain[2] as Comment, byId)).toBe(3);
  });

  it("stops at a missing parent rather than failing", () => {
    const orphan = makeComment("orphan", "long-gone");
    expect(depthOf(orphan, new Map([[orphan.id, orphan]]))).toBe(1);
  });

  it("terminates on looped data instead of counting forever", () => {
    const a = makeComment("a", "b");
    const b = makeComment("b", "a");
    const looped = new Map([
      ["a", a],
      ["b", b],
    ]);

    expect(depthOf(a, looped)).toBeLessThanOrEqual(MAX_REPLY_DEPTH + 2);
  });
});
