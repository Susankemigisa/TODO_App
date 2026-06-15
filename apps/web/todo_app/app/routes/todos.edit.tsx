import { Form, useLoaderData, useActionData } from "react-router";
import { useState } from "react";
import { requireAccessToken } from "../session.server";
import { apiFetch } from "../utils/api.server";
import { redirect } from "react-router";
import type { Route } from "./+types/todos.edit";
import {
  dateToWeekValue,
  weekValueToDate,
  dateToMonthValue,
  monthValueToDate,
} from "../utils/recurrence-dates";

export async function loader({ params, request }: Route.LoaderArgs) {
  const token = await requireAccessToken(request);
  const todo = await apiFetch(`/todos/${params.id}`, token);
  if (!todo) throw new Response("Not Found", { status: 404 });
  return { todo };
}

export async function action({ request, params }: Route.ActionArgs) {
  const token = await requireAccessToken(request);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  const recurrence = (formData.get("recurrence") as string) || "NONE";
  const dueDateRaw = formData.get("dueDate") as string;
  const notes = formData.get("notes") as string;

  if (!title || title.trim() === "") {
    return { error: "Title cannot be empty" };
  }

  const isRecurring = recurrence !== "NONE";

  let startDate: string | null = null;
  let endDate: string | null = null;

  if (isRecurring) {
    if (recurrence === "DAILY") {
      const startDateRaw = formData.get("startDate") as string;
      const endDateRaw = formData.get("endDate") as string;
      startDate = startDateRaw || null;
      endDate = endDateRaw || null;
    } else if (recurrence === "WEEKLY") {
      const startWeekRaw = formData.get("startWeek") as string;
      const endWeekRaw = formData.get("endWeek") as string;
      startDate = startWeekRaw ? weekValueToDate(startWeekRaw).toISOString() : null;
      endDate = endWeekRaw ? weekValueToDate(endWeekRaw, true).toISOString() : null;
    } else if (recurrence === "MONTHLY") {
      const startMonthRaw = formData.get("startMonth") as string;
      const endMonthRaw = formData.get("endMonth") as string;
      startDate = startMonthRaw ? monthValueToDate(startMonthRaw).toISOString() : null;
      endDate = endMonthRaw ? monthValueToDate(endMonthRaw, true).toISOString() : null;
    }
  }

  await apiFetch(`/todos/${params.id}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      title: title.trim(),
      priority,
      recurrence,
      notes: notes?.trim() || null,
      dueDate: isRecurring ? null : (dueDateRaw || null),
      startDate,
      endDate,
    }),
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
  const actionData = useActionData<typeof action>();

  const [recurrence, setRecurrence] = useState(todo.recurrence ?? "NONE");
  const isRecurring = recurrence !== "NONE";

  const dueDateValue = todo.dueDate
    ? new Date(todo.dueDate).toISOString().split("T")[0]
    : "";
  const startDateValue = todo.startDate
    ? new Date(todo.startDate).toISOString().split("T")[0]
    : "";
  const endDateValue = todo.endDate
    ? new Date(todo.endDate).toISOString().split("T")[0]
    : "";
  const startWeekValue = todo.startDate ? dateToWeekValue(new Date(todo.startDate)) : "";
  const endWeekValue = todo.endDate ? dateToWeekValue(new Date(todo.endDate)) : "";
  const startMonthValue = todo.startDate ? dateToMonthValue(new Date(todo.startDate)) : "";
  const endMonthValue = todo.endDate ? dateToMonthValue(new Date(todo.endDate)) : "";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-page: #F5F2EC; --bg-card: #FFFFFF; --bg-banner: #111111;
          --bg-input: #F9F7F3; --text-primary: #111111; --text-muted: #999999;
          --text-faint: #CCCCCC; --border: #E8E3DA; --border-focus: #C9A96E;
          --gold: #C9A96E; --gold-glow: rgba(201,169,110,0.15);
          --btn-bg: #111111; --btn-hover: #2a2a2a;
          --shadow-card: 0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.09);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-page: #0E0E0E; --bg-card: #1A1A1A; --bg-banner: #000000;
            --bg-input: #242424; --text-primary: #F0EDE7; --text-muted: #999999;
            --text-faint: #808080; --border: #2E2E2E; --border-focus: #C9A96E;
            --gold: #C9A96E; --gold-glow: rgba(201,169,110,0.12);
            --btn-bg: #F0EDE7; --btn-hover: #FFFFFF;
            --shadow-card: 0 4px 8px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5);
          }
        }
        body { background: var(--bg-page); font-family: 'DM Sans', sans-serif; color: var(--text-primary); min-height: 100vh; }
        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 60px 20px 80px; }
        .card { width: 100%; max-width: 580px; background: var(--bg-card); border-radius: 24px; box-shadow: var(--shadow-card); overflow: hidden; border: 1px solid var(--border); }
        .banner { background: var(--bg-banner); padding: 38px 44px 32px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #555; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .back-link:hover { color: #888; }
        .banner-label { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #555; margin-bottom: 8px; }
        .banner-title { font-family: 'DM Serif Display', serif; font-size: 38px; color: #fff; line-height: 1.05; }
        .banner-title em { font-style: italic; color: var(--gold); }
        .body { padding: 36px 44px 44px; }
        .fields { display: flex; flex-direction: column; gap: 22px; }
        .field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .field-input, .field-select, .field-date, .field-textarea {
          width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
          padding: 14px 18px; font-family: 'DM Sans', sans-serif; font-size: 14px;
          font-weight: 500; color: var(--text-primary); background: var(--bg-input);
          outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-textarea { resize: vertical; min-height: 80px; }
        .field-input:focus, .field-select:focus, .field-date:focus, .field-textarea:focus {
          border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--gold-glow); background: var(--bg-card);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .recurrence-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-style: italic; }
        .error { font-size: 13px; color: #DC2626; font-weight: 500; padding: 10px 14px; background: rgba(220,38,38,0.08); border-radius: 8px; border: 1px solid rgba(220,38,38,0.2); }
        .actions { display: flex; gap: 10px; margin-top: 32px; }
        .save-btn { background: var(--btn-bg); color: var(--bg-card); border: none; border-radius: 12px; padding: 14px 32px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.1s; }
        .save-btn:hover { background: var(--btn-hover); }
        .save-btn:active { transform: scale(0.97); }
        .cancel-link { display: inline-flex; align-items: center; border: 1.5px solid var(--border); border-radius: 12px; padding: 14px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-muted); text-decoration: none; transition: background 0.15s, color 0.15s; }
        .cancel-link:hover { background: var(--bg-input); color: var(--text-primary); }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="banner">
            <a href="/" className="back-link">← Back</a>
            <p className="banner-label">Editing task</p>
            <h1 className="banner-title">Edit <em>Task</em></h1>
          </div>

          <div className="body">
            <Form method="post">
              <div className="fields">

                {actionData?.error && (
                  <div className="error">{actionData.error}</div>
                )}

                <div>
                  <label className="field-label" htmlFor="title">Title</label>
                  <input
                    id="title" name="title" type="text"
                    className="field-input" defaultValue={todo.title}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="notes">Notes</label>
                  <textarea
                    id="notes" name="notes"
                    className="field-textarea"
                    defaultValue={todo.notes ?? ""}
                    placeholder="Add any extra details..."
                  />
                </div>

                <div className="two-col">
                  <div>
                    <label className="field-label" htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" className="field-select" defaultValue={todo.priority}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="recurrence">Recurrence</label>
                    <select
                      id="recurrence" name="recurrence"
                      className="field-select"
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value)}
                    >
                      <option value="NONE">One-off</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                {!isRecurring ? (
                  <div>
                    <label className="field-label" htmlFor="dueDate">Due date</label>
                    <input
                      id="dueDate" name="dueDate" type="date"
                      className="field-date" defaultValue={dueDateValue}
                    />
                  </div>
                ) : recurrence === "WEEKLY" ? (
                  <div className="two-col">
                    <div>
                      <label className="field-label" htmlFor="startWeek">Start week</label>
                      <input
                        id="startWeek" name="startWeek" type="week"
                        className="field-date" defaultValue={startWeekValue}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="endWeek">End week</label>
                      <input
                        id="endWeek" name="endWeek" type="week"
                        className="field-date" defaultValue={endWeekValue}
                      />
                    </div>
                  </div>
                ) : recurrence === "MONTHLY" ? (
                  <div className="two-col">
                    <div>
                      <label className="field-label" htmlFor="startMonth">Start month</label>
                      <input
                        id="startMonth" name="startMonth" type="month"
                        className="field-date" defaultValue={startMonthValue}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="endMonth">End month</label>
                      <input
                        id="endMonth" name="endMonth" type="month"
                        className="field-date" defaultValue={endMonthValue}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="two-col">
                    <div>
                      <label className="field-label" htmlFor="startDate">Start date</label>
                      <input
                        id="startDate" name="startDate" type="date"
                        className="field-date" defaultValue={startDateValue}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="endDate">End date</label>
                      <input
                        id="endDate" name="endDate" type="date"
                        className="field-date" defaultValue={endDateValue}
                      />
                    </div>
                  </div>
                )}

                {isRecurring && (
                  <p className="recurrence-hint">
                    {recurrence === "DAILY" && "Task repeats every day between start and end date."}
                    {recurrence === "WEEKLY" && "Task repeats every week. Pick the first and last week."}
                    {recurrence === "MONTHLY" && "Task repeats every month. Pick the first and last month."}
                  </p>
                )}

              </div>

              <div className="actions">
                <button type="submit" className="save-btn">Save changes</button>
                <a href="/" className="cancel-link">Cancel</a>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}