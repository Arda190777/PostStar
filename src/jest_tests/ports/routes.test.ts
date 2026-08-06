// Tests for ports/rest/routes — checks that every endpoint the README documents
// is actually registered, at the right path and HTTP method, and that the routes
// meant to be protected really do sit behind the authenticate middleware.
//
// These are wiring tests: a controller can be perfect and still unreachable if
// its route was never mounted, and nothing else in the suite would notice.

import authRoutes from "../../ports/rest/routes/auth.routes.js";
import postsRoutes from "../../ports/rest/routes/posts.routes.js";
import adminRoutes from "../../ports/rest/routes/admin.routes.js";

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ name: string }>;
  };
}

interface TestRouter {
  stack: RouteLayer[];
}

/** Lists a router's endpoints as "METHOD /path" strings */
const endpointsOf = (router: unknown): string[] =>
  (router as TestRouter).stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const route = layer.route!;
      const method = Object.keys(route.methods)[0]?.toUpperCase() ?? "?";
      return `${method} ${route.path}`;
    });

/** Names of the middleware functions running before a given endpoint's handler */
const middlewareOf = (router: unknown, method: string, path: string): string[] => {
  const layer = (router as TestRouter).stack.find(
    (l) => l.route?.path === path && l.route.methods[method.toLowerCase()],
  );

  if (!layer?.route) throw new Error(`No route registered for ${method} ${path}`);
  return layer.route.stack.map((handler) => handler.name);
};

describe("auth routes", () => {
  it("registers the endpoints the README documents", () => {
    expect(endpointsOf(authRoutes).sort()).toEqual([
      "POST /login",
      "POST /register",
    ]);
  });

  it("leaves register and login public — they are how a token is obtained", () => {
    expect(middlewareOf(authRoutes, "POST", "/register")).not.toContain("authenticate");
    expect(middlewareOf(authRoutes, "POST", "/login")).not.toContain("authenticate");
  });
});

describe("posts routes", () => {
  it("registers every post, comment, and like endpoint", () => {
    expect(endpointsOf(postsRoutes).sort()).toEqual(
      [
        "GET /",
        "POST /",
        "PUT /:id",
        "DELETE /:id",
        "GET /:postId/comments",
        "POST /:postId/comments",
        "PUT /:postId/comments/:commentId",
        "DELETE /:postId/comments/:commentId",
        "POST /:postId/like",
      ].sort(),
    );
  });

  it.each([
    ["POST", "/"],
    ["PUT", "/:id"],
    ["DELETE", "/:id"],
    ["POST", "/:postId/comments"],
    ["PUT", "/:postId/comments/:commentId"],
    ["DELETE", "/:postId/comments/:commentId"],
    ["POST", "/:postId/like"],
  ])("requires a token for %s %s", (method, path) => {
    expect(middlewareOf(postsRoutes, method, path)).toContain("authenticate");
  });

  it.each([
    ["GET", "/"],
    ["GET", "/:postId/comments"],
  ])("keeps %s %s readable without a token", (method, path) => {
    expect(middlewareOf(postsRoutes, method, path)).not.toContain("authenticate");
  });
});

describe("admin routes", () => {
  it("registers every admin endpoint", () => {
    expect(endpointsOf(adminRoutes).sort()).toEqual(
      [
        "GET /stats",
        "GET /users",
        "DELETE /posts/:id",
        "DELETE /comments/:id",
        "PATCH /users/:id/status",
      ].sort(),
    );
  });

  it.each([
    ["GET", "/stats"],
    ["GET", "/users"],
    ["DELETE", "/posts/:id"],
    ["DELETE", "/comments/:id"],
    ["PATCH", "/users/:id/status"],
  ])("guards %s %s with both authenticate and a role check", (method, path) => {
    const middleware = middlewareOf(adminRoutes, method, path);

    // requireRole returns an inner function, so the check is on count and order:
    // authenticate first, then the role guard, then the controller.
    expect(middleware).toContain("authenticate");
    expect(middleware.length).toBeGreaterThanOrEqual(3);
    expect(middleware[0]).toBe("authenticate");
  });
});
