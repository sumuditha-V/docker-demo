import { useEffect, useState } from "react";

const api = (path, options) =>
  fetch(`/api/todos${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  const load = () => api("").then((r) => r.json()).then(setTodos);
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api("", { method: "POST", body: JSON.stringify({ title }) });
    setTitle("");
    load();
  };

  const toggle = async (t) => {
    await api(`/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !t.done }),
    });
    load();
  };

  const remove = async (t) => {
    await api(`/${t.id}`, { method: "DELETE" });
    load();
  };

  const left = todos.filter((t) => !t.done).length;

  return (
    <main>
      <header>
        <h1>Todos</h1>
        {todos.length > 0 && <span>{left} remaining</span>}
      </header>

      <form onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
        />
        <button type="submit">Add</button>
      </form>

      {todos.length === 0 ? (
        <p className="empty">Nothing here yet.</p>
      ) : (
        <ul>
          {todos.map((t) => (
            <li key={t.id}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t)}
              />
              <span className={t.done ? "done" : ""}>{t.title}</span>
              <button
                className="delete"
                onClick={() => remove(t)}
                aria-label={`Delete ${t.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
