import { Form, useLoaderData, redirect } from "react-router";
import { db } from "../db.server";
import type { Route } from "./+types/todos.edit";

// ── LOADER — fetch the single todo by ID ──
export async function loader({ params }: Route.LoaderArgs) {
  const todo = await db.todo.findUnique({
    where: { id: params.id },
  });

  if (!todo) throw new Response("Not Found", { status: 404 });

  return { todo };
}

// ── ACTION — save the updated title ──
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;

  if (!title || title.trim() === "") {
    return { error: "Title cannot be empty" };
  }

  await db.todo.update({
    where: { id: params.id },
    data: { title: title.trim() },
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
          justify-content: flex-start;
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

        .banner-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #777;
          margin-bottom: 8px;
        }

        .banner-title {
          font-family: 'DM Serif Display', serif;
          font-size: 38px;
          color: #fff;
          line-height: 1.05;
        }

        .banner-title em {
          font-style: italic;
          color: var(--gold);
        }

        .body {
          padding: 36px 44px 44px;
        }

        .field {
          margin-bottom: 24px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
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

        .error {
          margin-top: 8px;
          font-size: 13px;
          color: #DC2626;
          font-weight: 500;
        }

        .meta {
          font-size: 12px;
          color: var(--text-faint);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .meta strong {
          color: var(--text-muted);
          font-weight: 600;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .save-btn {
          background: var(--btn-bg);
          color: var(--bg-banner);
          border: none;
          border-radius: 12px;
          padding: 13px 28px;
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
          padding: 13px 22px;
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
            <p className="banner-label">Editing Task</p>
            <h1 className="banner-title">
              <em>Edit</em> Task
            </h1>
          </div>

          <div className="body">
            <div className="meta">
              <strong>Created:</strong>{" "}
              {new Date(todo.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              <br />
              <strong>Status:</strong>{" "}
              {todo.done ? "Completed ✓" : "Active"}
            </div>

            <Form method="post">
              <div className="field">
                <label className="field-label" htmlFor="title">
                  Task Title
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={todo.title}
                  autoFocus
                  className="field-input"
                  placeholder="Enter task title…"
                />
              </div>

              <div className="actions">
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
                <a href="/" className="cancel-link">
                  Cancel
                </a>
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