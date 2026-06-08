import { Form, useLoaderData } from "react-router";
import { useState } from "react";
import { db } from "../db.server";
import { requireUserId, getUser } from "../session.server";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";

  const baseWhere = { userId };
  const where =
    filter === "active"
      ? { ...baseWhere, done: false }
      : filter === "completed"
      ? { ...baseWhere, done: true }
      : baseWhere;

  const todos = await db.todo.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const totalCount = await db.todo.count({ where: baseWhere });
  const activeCount = await db.todo.count({ where: { ...baseWhere, done: false } });
  const completedCount = await db.todo.count({ where: { ...baseWhere, done: true } });

  return { todos, filter, totalCount, activeCount, completedCount, user };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const title = formData.get("title") as string;
    const priority = (formData.get("priority") as string) || "MEDIUM";
    const dueDateRaw = formData.get("dueDate") as string;
    if (!title || title.trim() === "") return { error: "Title cannot be empty" };
    await db.todo.create({
      data: {
        title: title.trim(),
        priority: priority as "LOW" | "MEDIUM" | "HIGH",
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        user: { connect: { id: userId } },
      },
    });
  }

  if (intent === "toggle") {
    const id = formData.get("id") as string;
    const done = formData.get("done") === "true";
    await db.todo.updateMany({ where: { id, userId }, data: { done: !done } });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await db.todo.deleteMany({ where: { id, userId } });
  }

  if (intent === "edit") {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    if (!title || title.trim() === "") return { error: "Title cannot be empty" };
    await db.todo.updateMany({ where: { id, userId }, data: { title: title.trim() } });
  }

  return null;
}

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
    },
  ];
}

const PRIORITY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: "Low",    color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  MEDIUM: { label: "Medium", color: "#C9A96E", bg: "rgba(201,169,110,0.20)" },
  HIGH:   { label: "High",   color: "#FF4444", bg: "rgba(255,68,68,0.15)"   },
};

function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase" as const, padding: "2px 8px", borderRadius: "99px",
      color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}

function formatDueDate(date: string | Date | null) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.setHours(0,0,0,0)) / (1000*60*60*24));
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDays < 0) return { text: `Overdue · ${formatted}`, color: "#DC2626" };
  if (diffDays === 0) return { text: `Due today · ${formatted}`, color: "#C9A96E" };
  if (diffDays === 1) return { text: `Due tomorrow · ${formatted}`, color: "#C9A96E" };
  return { text: `Due ${formatted}`, color: "#6B7280" };
}

export default function Home() {
  const { todos, filter, totalCount, activeCount, completedCount, user } =
    useLoaderData<typeof loader>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);

  const progressPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-page:       #F5F2EC;
          --bg-card:       #FFFFFF;
          --bg-banner:     #111111;
          --bg-input:      #F9F7F3;
          --bg-filter:     #F0EDE7;
          --bg-item-hover: #F9F7F3;
          --bg-edit-input: #FFFDF9;
          --text-primary:  #111111;
          --text-muted:    #999999;
          --text-faint:    #CCCCCC;
          --text-banner:   #FFFFFF;
          --text-banner-muted: #777777;
          --border:        #E8E3DA;
          --border-focus:  #C9A96E;
          --gold:          #C9A96E;
          --gold-glow:     rgba(201,169,110,0.15);
          --btn-bg:        #111111;
          --btn-hover:     #2a2a2a;
          --filter-active-bg:    #FFFFFF;
          --filter-active-color: #111111;
          --filter-active-shadow: 0 1px 6px rgba(0,0,0,0.10);
          --shadow-card:   0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.09);
          --stat-divider:  #F0EDE7;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg-page:       #0E0E0E;
            --bg-card:       #1A1A1A;
            --bg-banner:     #000000;
            --bg-input:      #242424;
            --bg-filter:     #242424;
            --bg-item-hover: #222222;
            --bg-edit-input: #1E1C18;
            --text-primary:  #F0EDE7;
            --text-muted:    #999999;
            --text-faint:    #808080;
            --text-banner:   #F0EDE7;
            --text-banner-muted: #808080;
            --border:        #2E2E2E;
            --border-focus:  #C9A96E;
            --gold:          #C9A96E;
            --gold-glow:     rgba(201,169,110,0.12);
            --btn-bg:        #F0EDE7;
            --btn-hover:     #FFFFFF;
            --filter-active-bg:    #333333;
            --filter-active-color: #F0EDE7;
            --filter-active-shadow: 0 1px 6px rgba(0,0,0,0.4);
            --shadow-card:   0 4px 8px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5);
            --stat-divider:  #2A2A2A;
          }
        }

        body {
          background: var(--bg-page);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          transition: background 0.3s;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px 0;
        }

        .card {
          width: 100%;
          max-width: 580px;
          background: var(--bg-card);
          border-radius: 24px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .banner {
          background: var(--bg-banner);
          padding: 38px 44px 32px;
        }

        .banner-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .user-email {
          font-size: 11px;
          font-weight: 500;
          color: #555;
          letter-spacing: 0.04em;
        }

        .logout-btn {
          background: transparent;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 5px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .logout-btn:hover { border-color: #555; color: #888; }

        .banner-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--text-banner-muted); margin-bottom: 8px;
        }

        .banner-title {
          font-family: 'DM Serif Display', serif;
          font-size: 44px; font-weight: 400; color: var(--text-banner); line-height: 1.05;
        }

        .banner-title em { font-style: italic; color: var(--gold); }

        .progress-row {
          display: flex; align-items: center; gap: 14px; margin-top: 28px;
        }

        .progress-track {
          flex: 1; height: 2px; background: #2a2a2a; border-radius: 99px; overflow: hidden;
        }

        .progress-fill {
          height: 100%; background: var(--gold); border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-pct {
          font-size: 12px; font-weight: 600; color: var(--text-banner-muted);
          white-space: nowrap; letter-spacing: 0.04em;
        }

        .stats { display: flex; border-bottom: 1px solid var(--stat-divider); }

        .stat {
          flex: 1; padding: 20px 0; text-align: center;
          border-right: 1px solid var(--stat-divider);
        }

        .stat:last-child { border-right: none; }

        .stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 30px; color: var(--text-primary); line-height: 1;
        }

        .stat-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--text-muted); margin-top: 5px;
        }

        .body { padding: 32px 44px 40px; }

        .add-row { display: flex; gap: 10px; margin-bottom: 8px; }

        .add-input {
          flex: 1; border: 1.5px solid var(--border); border-radius: 12px;
          padding: 13px 17px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: var(--text-primary);
          background: var(--bg-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .add-input::placeholder { color: var(--text-faint); }

        .add-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: var(--bg-card);
        }

        .add-btn {
          background: var(--btn-bg); color: var(--bg-card);
          border: none; border-radius: 12px; padding: 13px 24px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.2s, transform 0.1s; white-space: nowrap;
        }

        .add-btn:hover { background: var(--btn-hover); }
        .add-btn:active { transform: scale(0.97); }

        .expand-btn {
          background: none; border: none; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; color: var(--text-muted);
          cursor: pointer; padding: 4px 2px; margin-bottom: 20px; transition: color 0.15s;
        }

        .expand-btn:hover { color: var(--text-primary); }

        .extra-fields {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;
        }

        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 6px;
        }

        .field-select, .field-date {
          width: 100%; border: 1.5px solid var(--border); border-radius: 10px;
          padding: 10px 13px; font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: var(--text-primary);
          background: var(--bg-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-select:focus, .field-date:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
        }

        .filters {
          display: flex; gap: 4px; background: var(--bg-filter);
          border-radius: 12px; padding: 4px; margin-bottom: 24px;
        }

        .filter-tab {
          flex: 1; text-align: center; padding: 9px; border-radius: 9px;
          font-size: 13px; font-weight: 500; color: var(--text-muted);
          text-decoration: none; transition: all 0.2s;
        }

        .filter-tab:hover { color: var(--text-primary); }

        .filter-tab.active {
          background: var(--filter-active-bg); color: var(--filter-active-color);
          font-weight: 700; box-shadow: var(--filter-active-shadow);
        }

        .todo-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }

        .todo-empty {
          padding: 52px 0; text-align: center;
          font-family: 'DM Serif Display', serif;
          font-style: italic; font-size: 16px; color: var(--text-faint);
        }

        .todo-item { border-radius: 12px; padding: 13px 14px; transition: background 0.15s; }
        .todo-item:hover { background: var(--bg-item-hover); }

        .todo-view { display: flex; align-items: flex-start; gap: 14px; }

        .toggle-btn {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid var(--border); background: transparent;
          cursor: pointer; flex-shrink: 0; margin-top: 2px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: transparent; transition: all 0.2s;
        }

        .toggle-btn:hover { border-color: var(--gold); }

        .toggle-btn.done {
          background: var(--text-primary); border-color: var(--text-primary);
          color: var(--bg-card);
        }

        .todo-content { flex: 1; min-width: 0; }

        .todo-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .todo-title {
          font-size: 14px; font-weight: 500; color: var(--text-primary); line-height: 1.4;
        }

        .todo-title.done {
          text-decoration: line-through; color: var(--text-faint); font-weight: 400;
        }

        .todo-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }

        .todo-date-text { font-size: 11px; font-weight: 500; }

        .todo-created { font-size: 11px; color: var(--text-faint); }

        .todo-actions {
          display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0;
        }

        .todo-item:hover .todo-actions { opacity: 1; }

        .action-btn {
          border: none; background: transparent; padding: 5px 10px;
          border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; color: var(--text-muted);
          transition: background 0.15s, color 0.15s; text-decoration: none;
          display: inline-block;
        }

        .action-btn:hover { background: var(--bg-filter); color: var(--text-primary); }
        .action-btn.delete:hover { background: rgba(220,38,38,0.08); color: #DC2626; }

        .edit-form { display: flex; gap: 8px; width: 100%; }

        .edit-input {
          flex: 1; border: 1.5px solid var(--border-focus); border-radius: 10px;
          padding: 10px 14px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; color: var(--text-primary);
          background: var(--bg-edit-input); outline: none;
          box-shadow: 0 0 0 3px var(--gold-glow);
        }

        .save-btn {
          background: var(--btn-bg); color: var(--bg-card);
          border: none; border-radius: 10px; padding: 10px 18px;
          font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.2s;
        }

        .save-btn:hover { background: var(--btn-hover); }

        .cancel-btn {
          background: transparent; border: 1.5px solid var(--border);
          border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--text-muted);
          transition: background 0.15s;
        }

        .cancel-btn:hover { background: var(--bg-filter); }

        .page-footer {
          margin-top: 32px; margin-bottom: 48px; text-align: center;
          font-size: 11px; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--text-faint);
        }

        .page-footer span { color: var(--gold); }
      `}</style>

      <div className="page">
        <div className="card">

          {/* BANNER */}
          <div className="banner">
            <div className="banner-top">
              <div>
                <p className="banner-label">Today's Focus</p>
                <h1 className="banner-title">My <em>Tasks</em></h1>
              </div>
              <div className="user-info">
                <span className="user-email">{user?.name ?? user?.email}</span>
                <Form method="post" action="/logout">
                  <button type="submit" className="logout-btn">Sign out</button>
                </Form>
              </div>
            </div>
            <div className="progress-row">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="progress-pct">{progressPct}% done</span>
            </div>
          </div>

          {/* STATS */}
          <div className="stats">
            {[
              { num: totalCount, label: "Total" },
              { num: activeCount, label: "Active" },
              { num: completedCount, label: "Done" },
            ].map(({ num, label }) => (
              <div key={label} className="stat">
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* BODY */}
          <div className="body">

            {/* ADD FORM */}
            <Form method="post" onSubmit={(e) => {
              setTimeout(() => (e.target as HTMLFormElement).reset(), 0);
            }}>
              <input type="hidden" name="intent" value="create" />
              <div className="add-row">
                <input
                  name="title"
                  placeholder="Add a new task…"
                  className="add-input"
                />
                <button type="submit" className="add-btn">Add</button>
              </div>

              <button
                type="button"
                className="expand-btn"
                onClick={() => setShowFullForm(v => !v)}
              >
                {showFullForm ? "▲ Hide options" : "▼ Set priority & due date"}
              </button>

              {showFullForm && (
                <div className="extra-fields">
                  <div>
                    <label htmlFor="priority" className="field-label">Priority</label>
                    <select id="priority" name="priority" className="field-select" defaultValue="MEDIUM">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="field-label">Due Date</label>
                    <input id="dueDate" type="date" name="dueDate" className="field-date" />
                  </div>
                </div>
              )}
            </Form>

            {/* FILTERS */}
            <div className="filters">
              {(["all", "active", "completed"] as const).map((f) => (
                <a
                  key={f}
                  href={f === "all" ? "/" : `/?filter=${f}`}
                  className={`filter-tab${filter === f ? " active" : ""}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </a>
              ))}
            </div>

            {/* LIST */}
            <ul className="todo-list">
              {todos.length === 0 ? (
                <li className="todo-empty">Nothing here yet.</li>
              ) : (
                todos.map((todo) => {
                  const due = formatDueDate(todo.dueDate);
                  return (
                    <li key={todo.id} className="todo-item">
                      {editingId === todo.id ? (
                        <Form
                          method="post"
                          className="edit-form"
                          onSubmit={() => setEditingId(null)}
                        >
                          <input type="hidden" name="intent" value="edit" />
                          <input type="hidden" name="id" value={todo.id} />
                          <input
                            name="title"
                            defaultValue={todo.title}
                            placeholder="Edit task title"
                            autoFocus
                            className="edit-input"
                          />
                          <button type="submit" className="save-btn">Save</button>
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </Form>
                      ) : (
                        <div className="todo-view">
                          <Form method="post">
                            <input type="hidden" name="intent" value="toggle" />
                            <input type="hidden" name="id" value={todo.id} />
                            <input type="hidden" name="done" value={String(todo.done)} />
                            <button
                              type="submit"
                              className={`toggle-btn${todo.done ? " done" : ""}`}
                            >
                              ✓
                            </button>
                          </Form>

                          <div className="todo-content">
                            <div className="todo-title-row">
                              <span className={`todo-title${todo.done ? " done" : ""}`}>
                                {todo.title}
                              </span>
                              <PriorityBadge priority={todo.priority} />
                            </div>
                            <div className="todo-meta">
                              {due && (
                                <span className="todo-date-text" style={{ color: due.color }}>
                                  {due.text}
                                </span>
                              )}
                              <span className="todo-created">
                                Added {new Date(todo.createdAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="todo-actions">
                            <a
                              href={`/todos/${todo.id}/edit`}
                              className="action-btn"
                            >
                              Edit
                            </a>
                            <Form method="post">
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="id" value={todo.id} />
                              <button type="submit" className="action-btn delete">
                                Delete
                              </button>
                            </Form>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        <footer className="page-footer">
          Built with <span>Remix</span> · <span>Prisma</span> · <span>PostgreSQL</span>
        </footer>
      </div>
    </>
  );
}