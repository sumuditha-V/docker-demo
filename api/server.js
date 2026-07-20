import express from "express";
import pg from "pg";

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// create table on boot (demo only — real apps use migrations)
// retry, because the database may still be starting up
for (let attempt = 1; ; attempt++) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false
      )
    `);
    break;
  } catch (e) {
    if (attempt >= 10) throw e;
    console.log(`db not ready (${e.code}), retrying in 3s`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

app.get("/api/todos", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM todos ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/todos", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const { rows } = await pool.query(
    "INSERT INTO todos (title) VALUES ($1) RETURNING *",
    [title]
  );
  res.status(201).json(rows[0]);
});

app.patch("/api/todos/:id", async (req, res) => {
  const { title, done } = req.body;
  const { rows } = await pool.query(
    `UPDATE todos SET title = COALESCE($1, title), done = COALESCE($2, done)
     WHERE id = $3 RETURNING *`,
    [title ?? null, done ?? null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

app.delete("/api/todos/:id", async (req, res) => {
  await pool.query("DELETE FROM todos WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

const server = app.listen(port, () => console.log(`api listening on ${port}`));

process.on("SIGTERM", () => {
  server.close(() => pool.end().then(() => process.exit(0)));
});
