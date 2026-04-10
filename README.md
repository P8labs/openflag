# Openflag Go API Server

This repository now includes a Go API server that mirrors the data model from the Next.js app and keeps the code organized by feature.

## Structure

- `cmd/api` - executable entrypoint
- `internal/config` - environment loading
- `internal/database` - Gorm connection and migrations
- `internal/modules/auth` - GitHub and Google OAuth login
- `internal/modules/projects` - project CRUD
- `internal/modules/posts` - post CRUD with project linking
- `internal/modules/comments` - comment CRUD with post linking
- `internal/middleware` - JWT auth guard
- `internal/models` - shared Gorm models

## API

Base path: `/api/v1`

Auth:

- `GET /auth/:provider/login`
- `GET /auth/:provider/callback`
- `GET /api/v1/me`
- `POST /auth/logout`

Projects:

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

Posts:

- `GET /posts`
- `POST /posts`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

Comments:

- `GET /posts/:postId/comments`
- `POST /posts/:postId/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

## Run

1. Copy `.env.example` to `.env` and fill in the OAuth and database values.
2. Start Postgres locally.
3. Run the server:

```bash
go run ./cmd/api
```

The server listens on `PORT` and auto-migrates the schema on startup.
