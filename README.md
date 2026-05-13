# PostStar

A full-featured forum REST API built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**, following Clean Architecture principles. Users can register, create posts, leave comments, and like content — all secured with JWT authentication.

## Features

- **Authentication** — Register and login with JWT-based token auth
- **Posts** — Create, read, update, and delete forum posts
- **Comments** — Threaded comments on each post
- **Likes** — Like posts (once per user)
- **Admin Panel** — Stats overview, user management, and content moderation
- **Simple UI** — Browser-accessible frontend served at `/`
- **Clean Architecture** — Domain, ports, infrastructure layers clearly separated
- **Test Coverage** — 60%+ coverage with Jest

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Testing | Jest + ts-jest |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
git clone https://github.com/Arda190777/PostStar.git
cd PostStar
npm install
```

### Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for signing tokens | — |

### Running

```bash
# Development (auto-rebuild on save)
npm run dev

# Production build
npm run build
npm start
```

Open `http://localhost:3000` in your browser to access the UI.

### Seed Data

```bash
npm run seed
```

### Tests

```bash
npm test
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a new account | No |
| POST | `/auth/login` | Login and receive a JWT | No |

### Posts
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/posts` | List all posts | No |
| POST | `/posts` | Create a post | Yes |
| PUT | `/posts/:id` | Edit a post | Yes |
| DELETE | `/posts/:id` | Delete a post | Yes |

### Comments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/posts/:postId/comments` | Get comments on a post | No |
| POST | `/posts/:postId/comments` | Add a comment | Yes |
| PUT | `/posts/:postId/comments/:commentId` | Edit a comment | Yes |
| DELETE | `/posts/:postId/comments/:commentId` | Delete a comment | Yes |

### Likes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/posts/:postId/like` | Like a post | Yes |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/stats` | Site-wide stats | Admin |
| GET | `/admin/users` | Per-user activity | Admin |
| DELETE | `/admin/posts/:id` | Delete any post | Admin |
| DELETE | `/admin/comments/:id` | Delete any comment | Admin |
| PATCH | `/admin/users/:id/status` | Block / reactivate a user | Admin |

> All `Yes` routes require `Authorization: Bearer <token>` header.  
> `Admin` routes additionally require `admin` or `superuser` role.

## Project Structure

```
src/
├── config/          # Environment config
├── controllers/     # Request handlers
├── domain/          # Business rules & factories
├── infrastructure/  # MongoDB models & repositories
│   ├── models/
│   └── repositories/
├── middleware/      # Auth & role guards
├── ports/
│   ├── repositories/  # Repository interfaces
│   └── rest/routes/   # Express routers
└── jest_tests/      # Unit & integration tests

public/              # Static UI (served at /)
```

## License

ISC
