# Todo App — Dockerized

A minimal todo CRUD: React (Vite) frontend, Express API, PostgreSQL database.

## Architecture

```
browser -> web (nginx :8080) -> api (express :3000) -> db (postgres :5432)
```

All three run as containers on a private Compose network. The frontend never
talks to Postgres directly; nginx proxies `/api/*` through to the API service.

## Prerequisites

Docker Desktop.

## Running

```bash
docker compose up --build
```

Open http://localhost:8080

To stop:

```bash
docker compose down          # keeps the database data
docker compose down -v       # also deletes the volume (fresh database)
```

## Services

| Service | Image             | Port           | Purpose               |
|---------|-------------------|----------------|-----------------------|
| `web`   | built from `/web` | 8080 -> 80     | React SPA behind nginx |
| `api`   | built from `/api` | 3000 -> 3000   | Express REST API      |
| `db`    | `postgres:17-alpine` | internal only | PostgreSQL            |

The database port is not published to the host — nothing outside the Compose
network needs it. Add `ports: ["5432:5432"]` to the `db` service if you want to
connect with a GUI client.

## How the app connects to the database

The API reads a single environment variable, set in `docker-compose.yml`:

```
DATABASE_URL=postgres://postgres:postgres@db:5432/todos
```

The host is `db` — the Compose service name. Docker's internal DNS resolves it
to that container's IP. Using `localhost` here would fail, because inside the
API container `localhost` refers to the API container itself.

The `db` service has a healthcheck (`pg_isready`), and `api` declares
`depends_on: db: condition: service_healthy`. This matters because the API runs
`CREATE TABLE` on startup: without it the API would start while Postgres was
still initialising and crash.

## API

| Method | Route             | Body               |
|--------|-------------------|--------------------|
| GET    | `/api/todos`      | —                  |
| POST   | `/api/todos`      | `{ "title": "…" }` |
| PATCH  | `/api/todos/:id`  | `{ "done": true }` |
| DELETE | `/api/todos/:id`  | —                  |
| GET    | `/api/health`     | —                  |

## Data persistence

Postgres data lives in the named volume `pgdata`, mounted at
`/var/lib/postgresql/data`. Containers are disposable; the volume is not.

## Publishing the frontend image to GHCR

```bash
docker build -t ghcr.io/<username>/todo-web:latest ./web
docker push ghcr.io/<username>/todo-web:latest
```

Requires `docker login ghcr.io` with a GitHub personal access token that has
the `write:packages` scope.

## Notes / possible improvements

- Schema is created on boot. A real app would use migrations.
- Credentials are hardcoded for local development. Production would inject
  them as secrets rather than committing them to `docker-compose.yml`.
