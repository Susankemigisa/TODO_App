import { Form, useLoaderData, redirect } from "react-router";
import { db } from "../db.server";
import type { Route } from "./+types/todos.edit";

import { requireUserId } from "../session.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUserId(request);
  const todo = await db.todo.findUnique({
    where: { id: params.id },
  });
  if (!todo) throw new Response("Not Found", { status: 404 });
  return { todo };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  const dueDateRaw = formData.get("dueDate") as string;

  if (!title || title.trim() === "") {
    return { error: "Title cannot be empty" };
  }

  await db.todo.update({
    where: { id: params.id },
    data: {
      title: title.trim(),
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });

  return redirect("/");
}

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
    },
  ];
}

export default function EditTodo() {
  const { todo } = useLoaderData<typeof loader>();

  // Format date for the date input (needs YYYY-MM-DD)
  const dueDateValue = todo.dueDate
    ? new Date(todo.dueDate).toISOString().split("T")[0]
    : "";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-page:      #F5F2EC;
          --bg-card:      #FFFFFF;
          --bg-banner:    #111111;
          --bg-input:     #F9F7F3;
          --text-primary: #111111;
          --text-muted:   #999999;
          --text-faint:   #CCCCCC;
          --border:       #E8E3DA;
          --border-focus: #C9A96E;
          --gold:         #C9A96E;
          --gold-glow:    rgba(201,169,110,0.15);
          --btn-bg:       #111111;
          --btn-hover:    #2a2a2a;
          --shadow-card:  0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.09);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg-page:      #0E0E0E;
            --bg-card:      #1A1A1A;
            --bg-banner:    #000000;
            --bg-input:     #242424;
            --text-primary: #F0EDE7;
            --text-muted:   #999999;
            --text-faint:   #808080;
            --border:       #2E2E2E;
            --border-focus: #C9A96E;
            --gold:         #C9A96E;
            --gold-glow:    rgba(201,169,110,0.12);
            --btn-bg:       #F0EDE7;
            --btn-hover:    #FFFFFF;
            --shadow-card:  0 4px 8px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5);
          }
        }

        body {
          background: var(--bg-page);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px 80px;
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

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          text-decoration: none;
          margin-bottom: 20px;
          transition: color 0.15s;
        }

        .back-link:hover { color: #888; }

        .banner-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
        }

        .banner-title {
          font-family: 'DM Serif Display', serif;
          font-size: 38px;
          color: #fff;
          line-height: 1.05;
        }

        .banner-title em { font-style: italic; color: var(--gold); }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding: 5px 12px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.06);
          color: #666;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .body { padding: 36px 44px 44px; }

        .fields { display: flex; flex-direction: column; gap: 22px; }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 14px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--bg-input);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .field-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: var(--bg-card);
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field-select, .field-date {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--text-primary);
          background: var(--bg-input);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-select:focus, .field-date:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
        }

        .meta-box {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.8;
        }

        .meta-box strong {
          color: var(--text-primary);
          font-weight: 600;
        }

        .error {
          font-size: 13px;
          color: #DC2626;
          font-weight: 500;
          margin-top: 6px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 32px;
        }

        .save-btn {
          background: var(--btn-bg);
          color: var(--bg-card);
          border: none;
          border-radius: 12px;
          padding: 14px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.1s;
        }

        .save-btn:hover { background: var(--btn-hover); }
        .save-btn:active { transform: scale(0.97); }

        .cancel-link {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 14px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }

        .cancel-link:hover {
          background: var(--bg-input);
          color: var(--text-primary);
        }

        .page-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        .page-footer span { color: var(--gold); }
      `}</style>

      <div className="page">
        <div className="card">

          <div className="banner">
            <a href="/" className="back-link">← Back to tasks</a>
            <p className="banner-label">Editing Task</p>
            <h1 className="banner-title"><em>Edit</em> Task</h1>
            <div className="status-pill">
              <span
                className="status-dot"
                style={{ background: todo.done ? "#C9A96E" : "#6B7280" }}
              />
              {todo.done ? "Completed" : "Active"}
            </div>
          </div>

          <div className="body">
            <Form method="post">
              <div className="fields">

                {/* TITLE */}
                <div>
                  <label className="field-label" htmlFor="title">Task Title</label>
                  <input
                    id="title"
                    name="title"
                    defaultValue={todo.title}
                    autoFocus
                    className="field-input"
                    placeholder="Enter task title…"
                  />
                </div>

                {/* PRIORITY + DUE DATE */}
                <div className="two-col">
                  <div>
                    <label className="field-label" htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="field-select"
                      defaultValue={todo.priority}
                      title="Select task priority"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="dueDate">Due Date</label>
                    <input
                      id="dueDate"
                      type="date"
                      name="dueDate"
                      className="field-date"
                      defaultValue={dueDateValue}
                      title="Select due date"
                    />
                  </div>
                </div>

                {/* META INFO */}
                <div className="meta-box">
                  <strong>Created:</strong>{" "}
                  {new Date(todo.createdAt).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric",
                    month: "long", day: "numeric",
                  })}
                  <br />
                  <strong>Last updated:</strong>{" "}
                  {new Date(todo.updatedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>

              </div>

              <div className="actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <a href="/" className="cancel-link">Cancel</a>
              </div>
            </Form>
          </div>
        </div>

        <footer className="page-footer">
          Built with <span>Remix</span> · <span>Prisma</span> · <span>PostgreSQL</span>
        </footer>
      </div>
    </>
  );
}