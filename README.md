# 🌟 PostStar

> A full-featured forum REST API built with Node.js, Express, TypeScript, and MongoDB — following Clean Architecture principles.



PostStar lets users register, create posts, leave comments, and like content — all secured with JWT authentication and organized into clean, testable layers.

---

## ✨ Features

- 🔐 **Authentication** — Register and login with JWT-based token auth
- 📝 **Posts** — Create, read, update, and delete forum posts
- 💬 **Comments** — Threaded comments on each post
- ❤️ **Likes** — Like posts (once per user)
- 🛡️ **Admin Panel** — Stats overview, user management, and content moderation
- 🌐 **Simple UI** — Browser-accessible frontend served at `/`
- 🏛️ **Clean Architecture** — Domain, ports, and infrastructure layers clearly separated
- ✅ **Test Coverage** — 60%+ coverage with Jest

---

## 🛠️ Tech Stack

| Layer      | Technology           |
| ---------- | -------------------- |
| Runtime    | Node.js              |
| Framework  | Express 5            |
| Language   | TypeScript           |
| Database   | MongoDB + Mongoose   |
| Auth       | JWT                  |
| Testing    | Jest + ts-jest       |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** (local instance or MongoDB Atlas)

### Installation

```bash
git clone https://github.com/Arda190777/PostStar.git
cd PostStar
npm install
```

### Environment Variables

Copy `.env.example` and fill in your own values:

```bash
cp .env.example .env
```

| Variable      | Description                       | Default |
| ------------- | --------------------------------- | ------- |
| `PORT`        | Server port                       | `3000`  |
| `MONGODB_URI` | MongoDB connection string         | —       |
| `JWT_SECRET`  | Secret key for signing JWT tokens | —       |

### Running

```bash
# Development (auto-rebuild on save)
npm run dev

# Production build
npm run build
npm start
```

Open **http://localhost:3000** in your browser to access the UI.

### Seed Data

Populate the database with sample users, posts, and comments:

```bash
npm run seed
```

### Tests

```bash
npm test
```

---

## 📡 API Endpoints

### 🔑 Auth

| Method | Endpoint          | Description              | Auth |
| ------ | ----------------- | ------------------------ | ---- |
| POST   | `/auth/register`  | Create a new account     | ❌   |
| POST   | `/auth/login`     | Login and receive a JWT  | ❌   |

### 📝 Posts

| Method | Endpoint       | Description     | Auth |
| ------ | -------------- | --------------- | ---- |
| GET    | `/posts`       | List all posts  | ❌   |
| POST   | `/posts`       | Create a post   | ✅   |
| PUT    | `/posts/:id`   | Edit a post     | ✅   |
| DELETE | `/posts/:id`   | Delete a post   | ✅   |

### 💬 Comments

| Method | Endpoint                                  | Description           | Auth |
| ------ | ----------------------------------------- | --------------------- | ---- |
| GET    | `/posts/:postId/comments`                 | Get comments on a post| ❌   |
| POST   | `/posts/:postId/comments`                 | Add a comment         | ✅   |
| PUT    | `/posts/:postId/comments/:commentId`      | Edit a comment        | ✅   |
| DELETE | `/posts/:postId/comments/:commentId`      | Delete a comment      | ✅   |

### ❤️ Likes

| Method | Endpoint                | Description   | Auth |
| ------ | ----------------------- | ------------- | ---- |
| POST   | `/posts/:postId/like`   | Like a post   | ✅   |

### 🛡️ Admin

| Method | Endpoint                          | Description                    | Auth   |
| ------ | --------------------------------- | ------------------------------ | ------ |
| GET    | `/admin/stats`                    | Site-wide stats                | 👑 Admin |
| GET    | `/admin/users`                    | Per-user activity              | 👑 Admin |
| DELETE | `/admin/posts/:id`                | Delete any post                | 👑 Admin |
| DELETE | `/admin/comments/:id`             | Delete any comment             | 👑 Admin |
| PATCH  | `/admin/users/:id/status`         | Block / reactivate a user      | 👑 Admin |

> 🔒 All ✅ routes require an `Authorization: Bearer <token>` header.
> Admin routes additionally require the `admin` or `superuser` role.

---

## 📁 Project Structure

```
src/
├── config/             # Environment config
├── controllers/        # Request handlers
├── domain/             # Business rules & factories
├── infrastructure/     # MongoDB models & repositories
│   ├── models/
│   └── repositories/
├── middleware/         # Auth & role guards
├── ports/
│   ├── repositories/   # Repository interfaces
│   └── rest/routes/    # Express routers
└── jest_tests/         # Unit & integration tests

public/                 # Static UI (served at /)
```

This project follows **Clean Architecture**:

- **`domain/`** — Pure business logic, no external dependencies
- **`ports/`** — Interfaces (contracts) for repositories and transport layers
- **`infrastructure/`** — Concrete implementations (MongoDB, Mongoose models)
- **`controllers/` & `middleware/`** — HTTP-layer glue code

This separation makes the codebase easy to test, extend, and swap out (e.g., switch MongoDB for PostgreSQL by only changing the infrastructure layer).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source. Add your preferred license (e.g., MIT) here.

---

## 👤 Author

**Arda** — [@Arda190777](https://github.com/Arda190777)

⭐ If you like this project, give it a star on GitHub!
