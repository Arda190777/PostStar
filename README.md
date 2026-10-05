# PostStar

**A forum REST API with a simple browser frontend and a layered TypeScript backend.**

PostStar demonstrates account registration, token authentication, posts, comments, likes and administrative moderation using Express and MongoDB. The code separates domain factories, repository contracts, persistence adapters and HTTP handlers.

## Highlights

- Registration/login and HMAC-signed JWT authentication.
- Post and comment CRUD, with authenticated write routes.
- Per-user likes, admin statistics and content/user management routes.
- A static browser UI served from `public/`.
- Jest tests for domain, middleware, repositories and controllers.

## Stack

TypeScript · Node.js · Express 5 · MongoDB/Mongoose · Jest/ts-jest

## Run locally

Use Node.js 24 and a development MongoDB database.

```powershell
git clone https://github.com/Arda190777/PostStar.git
cd PostStar
npm ci
Copy-Item .env.example .env
```

Set these values in the ignored `.env` file:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to 3000 |
| `MONGODB_URI` | Your local or development MongoDB connection string |
| `JWT_SECRET` | A strong, private signing secret |

```powershell
npm run dev
```

Open http://localhost:3000 after MongoDB connects. `npm run seed` writes sample data; use it only against a disposable development database.

## Build and tests

```powershell
npm run build
npm test
```

`npm test` generates a Jest coverage report. Reported coverage depends on the current run; no fixed coverage percentage is promised here. `npm start` runs the compiled app after a build.

## API overview

| Route family | Responsibility |
| --- | --- |
| `/auth/register`, `/auth/login` | Account creation and token issuance |
| `/posts`, `/posts/:id` | Post listing and CRUD |
| `/posts/:postId/comments` | Post comments |
| `/posts/:postId/like` | Per-user likes |
| `/admin/*` | Statistics, moderation and user status management |

Authenticated routes expect `Authorization: Bearer <token>`; admin routes also apply role middleware. Concrete definitions are in [REST routes](src/ports/rest/routes).

## Code map

```text
src/domain/             Domain factories and rules
src/ports/              Repository contracts and REST routes
src/infrastructure/     MongoDB models and repositories
src/controllers/        Request handling
src/middleware/         Token and role checks
src/jest_tests/         Jest tests
public/                 Browser UI
bruno/                  API request collection
```

This is a portfolio/learning project. Authentication uses a custom implementation, so deployment hardening and security review remain separate work. Never use the fallback secret for a deployed service or commit database credentials. No standalone license file is included.
