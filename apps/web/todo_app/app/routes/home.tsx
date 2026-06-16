import { Form, useActionData, useLoaderData, useNavigate, useSubmit } from "react-router";
import { useState, useRef, useEffect } from "react";
import { requireUserId, requireAccessToken, getUser } from "../session.server";
import { apiFetch } from "../utils/api.server";
import { weekValueToDate, monthValueToDate } from "../utils/recurrence-dates";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const token = await requireAccessToken(request);
  const user = await getUser(request);
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const search = url.searchParams.get("search") ?? "";
  const showAll = url.searchParams.get("showAll") === "true";

  let allTodos: any[] = [];
  try {
    allTodos = await apiFetch(`/todos`, token);
  } catch (error: any) {
    if (error instanceof Response && error.status === 401) {
      const { logout } = await import("../session.server");
      return logout(request);
    }
    if (error?.message === "Invalid token") {
      const { logout } = await import("../session.server");
      return logout(request);
    }
    throw error;
  }

  // Apply filter
  let filtered = allTodos;
  if (filter === "active") filtered = allTodos.filter((t: any) => !t.done);
  if (filter === "completed") filtered = allTodos.filter((t: any) => t.done);

  // Apply search
  if (search) {
    filtered = filtered.filter((t: any) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort by due date priority
  function sortByDuePriority(todos: any[]) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    function priority(t: any) {
      if (!t.dueDate) return 3;
      const d = new Date(t.dueDate);
      if (d >= todayStart && d < todayEnd) return 0;
      if (d > todayEnd) return 1;
      return 2;
    }
    return [...todos].sort((a, b) => {
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // Group by createdAt date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  type Group = { label: string; todos: any[] };
  const groups: Group[] = [];

  const todayTodos = filtered.filter((t: any) => {
    const d = new Date(t.createdAt); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
  const yesterdayTodos = filtered.filter((t: any) => {
    const d = new Date(t.createdAt); d.setHours(0,0,0,0);
    return d.getTime() === yesterday.getTime();
  });
  const thisWeekTodos = filtered.filter((t: any) => {
    const d = new Date(t.createdAt); d.setHours(0,0,0,0);
    return d.getTime() < yesterday.getTime() && d.getTime() >= weekAgo.getTime();
  });
  const olderTodos = filtered.filter((t: any) => {
    const d = new Date(t.createdAt); d.setHours(0,0,0,0);
    return d.getTime() < weekAgo.getTime();
  });

  if (todayTodos.length) groups.push({ label: "Today", todos: sortByDuePriority(todayTodos) });
  if (yesterdayTodos.length) groups.push({ label: "Yesterday", todos: sortByDuePriority(yesterdayTodos) });
  if (thisWeekTodos.length) groups.push({ label: "This Week", todos: sortByDuePriority(thisWeekTodos) });
  const hasOlder = olderTodos.length > 0;
  if (showAll && olderTodos.length) groups.push({ label: "Older", todos: sortByDuePriority(olderTodos) });

  const totalCount = allTodos.length;
  const activeCount = allTodos.filter((t: any) => !t.done).length;
  const completedCount = allTodos.filter((t: any) => t.done).length;

  return { groups, filter, search, showAll, hasOlder, totalCount, activeCount, completedCount, user };
}

export async function action({ request }: Route.ActionArgs) {
  const token = await requireAccessToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const title = formData.get("title") as string;
    const priority = (formData.get("priority") as string) || "MEDIUM";
    const dueDateRaw = formData.get("dueDate") as string;
    const notes = formData.get("notes") as string;
    const recurrence = (formData.get("recurrence") as string) || "NONE";
    if (!title || title.trim() === "") return { error: "Title cannot be empty" };
    const isRecurring = recurrence !== "NONE";

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (isRecurring) {
      if (recurrence === "DAILY") {
        const startDateRaw = formData.get("startDate") as string;
        const endDateRaw = formData.get("endDate") as string;
        startDate = startDateRaw || new Date().toISOString();
        endDate = endDateRaw || null;
      } else if (recurrence === "WEEKLY") {
        const startWeekRaw = formData.get("startWeek") as string;
        const endWeekRaw = formData.get("endWeek") as string;
        startDate = startWeekRaw ? weekValueToDate(startWeekRaw).toISOString() : new Date().toISOString();
        endDate = endWeekRaw ? weekValueToDate(endWeekRaw, true).toISOString() : null;
      } else if (recurrence === "MONTHLY") {
        const startMonthRaw = formData.get("startMonth") as string;
        const endMonthRaw = formData.get("endMonth") as string;
        startDate = startMonthRaw ? monthValueToDate(startMonthRaw).toISOString() : new Date().toISOString();
        endDate = endMonthRaw ? monthValueToDate(endMonthRaw, true).toISOString() : null;
      }
    }

    await apiFetch("/todos", token, {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        priority,
        dueDate: isRecurring ? null : (dueDateRaw || null),
        startDate,
        endDate,
        notes: notes?.trim() || null,
        recurrence,
      }),
    });
  }

  if (intent === "toggle") {
    const id = formData.get("id") as string;
    const done = formData.get("done") === "true";
    await apiFetch(`/todos/${id}/toggle`, token, {
      method: "PATCH",
      body: JSON.stringify({ done: !done }),
    });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await apiFetch(`/todos/${id}`, token, { method: "DELETE" });
  }

  if (intent === "edit") {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    if (!title || title.trim() === "") return { error: "Title cannot be empty" };
    await apiFetch(`/todos/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ title: title.trim() }),
    });
  }

  if (intent === "add-subtask") {
    const todoId = formData.get("todoId") as string;
    const title = formData.get("subtaskTitle") as string;
    if (title?.trim()) {
      await apiFetch(`/todos/${todoId}/subtasks`, token, {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
    }
  }

  if (intent === "toggle-subtask") {
    const id = formData.get("id") as string;
    const done = formData.get("done") === "true";
    await apiFetch(`/todos/subtasks/${id}/toggle`, token, {
      method: "PATCH",
      body: JSON.stringify({ done: !done }),
    });
  }

  if (intent === "delete-subtask") {
    const id = formData.get("id") as string;
    await apiFetch(`/todos/subtasks/${id}`, token, { method: "DELETE" });
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

function formatDueDate(date: string | Date | null, recurrence?: string, startDate?: string | Date | null, endDate?: string | Date | null) {
  const isRecurring = recurrence && recurrence !== "NONE";

  // Recurring task — use startDate/endDate
  if (isRecurring && startDate) {
    const raw = typeof startDate === "string" ? startDate : startDate.toISOString();
    const [year, month, day] = raw.split("T")[0].split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedStart = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    let endText = "";
    if (endDate) {
      const endRaw = typeof endDate === "string" ? endDate : endDate.toISOString();
      const [ey, em, ed] = endRaw.split("T")[0].split("-").map(Number);
      const end = new Date(ey, em - 1, ed);
      const formattedEnd = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      endText = ` → ${formattedEnd}`;
    }

    if (diffDays < 0) return { text: `Started ${formattedStart}${endText} · ${String(recurrence).toLowerCase()}`, color: "#6B7280" };
    if (diffDays === 0) return { text: `Starts today${endText} · ${String(recurrence).toLowerCase()}`, color: "#C9A96E" };
    if (diffDays === 1) return { text: `Starts tomorrow${endText} · ${String(recurrence).toLowerCase()}`, color: "#C9A96E" };
    return { text: `Starts ${formattedStart}${endText} · ${String(recurrence).toLowerCase()}`, color: "#6B7280" };
  }

  // One-off task — use dueDate
  if (!date) return null;
  const raw = typeof date === "string" ? date : date.toISOString();
  const [year, month, day] = raw.split("T")[0].split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays < 0) return { text: `Overdue · ${formatted}`, color: "#DC2626" };
  if (diffDays === 0) return { text: `Due today · ${formatted}`, color: "#C9A96E" };
  if (diffDays === 1) return { text: `Due tomorrow · ${formatted}`, color: "#C9A96E" };
  return { text: `Due ${formatted}`, color: "#6B7280" };
}

function isFutureDueDate(date: string | Date | null) {
  if (!date) return false;
  const raw = typeof date === "string" ? date : date.toISOString();
  const [year, month, day] = raw.split("T")[0].split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() > today.getTime();
}

const VISIBLE_COUNT = 3;
// Total tasks shown across ALL groups before "See more"
const GLOBAL_VISIBLE = 3;

export default function Home() {
  const actionData = useActionData<{ error?: string }>();
  const { groups, filter, search, showAll, hasOlder, totalCount, activeCount, completedCount, user } =
  useLoaderData<typeof loader>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const todos = groups.flatMap(group => group.todos);
  const selectedDeleteTodo = deleteConfirmId ? todos.find((todo) => todo.id === deleteConfirmId) : undefined;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState("NONE");

  // Universal "See more"
  const [showMoreTasks, setShowMoreTasks] = useState(false);

  // Live search
  const submit = useSubmit();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      if (filter !== "all") params.set("filter", filter);
      submit(params, { method: "get", action: "/" });
    }, 300);
  }

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
          color: #b3b3b3;
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

        .add-input {
          width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
          padding: 13px 17px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: var(--text-primary);
          background: var(--bg-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          margin-bottom: 0;
        }

        .add-input::placeholder { color: var(--text-faint); }

        .add-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: var(--bg-card);
        }

        .add-btn {
          width: 100%;
          background: var(--btn-bg); color: var(--bg-card);
          border: none; border-radius: 12px; padding: 13px 24px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.2s, transform 0.1s;
          margin-top: 12px;
        }

        .add-btn:hover { background: var(--btn-hover); }
        .add-btn:active { transform: scale(0.97); }

        .expand-btn {
          background: none; border: none; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; color: var(--text-muted);
          cursor: pointer; padding: 4px 2px; margin: 8px 0 4px; transition: color 0.15s;
          display: block;
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

        .search-row { margin-bottom: 16px; position: relative; }

        .search-input {
          width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
          padding: 10px 40px 10px 14px; font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: var(--text-primary);
          background: var(--bg-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: var(--bg-card);
        }

        .search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          font-size: 16px; padding: 4px; line-height: 1;
          transition: color 0.15s;
        }

        .search-clear:hover { color: var(--text-primary); }

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

        .todo-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }

        .todo-date-text { font-size: 11px; font-weight: 500; }

        .todo-created { font-size: 11px; color: var(--text-faint); }

        .todo-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }

        .todo-item:hover .todo-actions { opacity: 1; }

        .toggle-btn.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          border-color: var(--border);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          padding: 24px;
        }

        .delete-modal {
          width: min(100%, 420px);
          padding: 28px;
          border-radius: 26px;
          background: rgba(17, 17, 17, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
        }

        .delete-modal p {
          margin: 0 0 18px;
          color: #fff;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .confirm-btn {
          background: #EF4444;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 10px 18px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
        }

        .confirm-btn:hover { background: #DC2626; }

        .form-error {
          margin-bottom: 18px;
          color: #DC2626;
          font-size: 13px;
          font-weight: 700;
        }

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

        .see-more-btn {
          width: 100%; background: none; border: 1px dashed var(--border);
          border-radius: 10px; padding: 9px; margin-top: 6px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          color: var(--text-muted); cursor: pointer; transition: background 0.15s, color 0.15s;
        }

        .see-more-btn:hover { background: var(--bg-filter); color: var(--text-primary); }

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
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="40,4 72,40 40,76 8,40" fill="none" stroke="#C9A96E" strokeWidth="2.5"/>
                  <line x1="8" y1="40" x2="72" y2="40" stroke="#C9A96E" strokeWidth="1" opacity="0.35"/>
                  <line x1="40" y1="4" x2="40" y2="76" stroke="#C9A96E" strokeWidth="1" opacity="0.35"/>
                  <line x1="8" y1="40" x2="40" y2="4" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2"/>
                  <line x1="72" y1="40" x2="40" y2="4" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2"/>
                  <polygon points="40,18 58,40 40,62 22,40" fill="#C9A96E" opacity="0.12"/>
                </svg>
                <div>
                  <p className="banner-label">Today's Focus</p>
                  <h1 className="banner-title">My <em>Tasks</em></h1>
                </div>
              </div>
              <div className="user-info">
                <span className="user-email">{user?.name ?? user?.email}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <a href="/settings" title="Settings" style={{
                    background: "transparent", border: "1px solid #333", borderRadius: "8px",
                    padding: "5px 8px", display: "inline-flex", alignItems: "center",
                    justifyContent: "center", color: "#b3b3b3", textDecoration: "none",
                    transition: "color 0.2s, border-color 0.2s",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </a>
                </div>
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
            {actionData?.error ? (
              <div className="form-error">{actionData.error}</div>
            ) : null}

            {/* ADD FORM — input first, options toggle, Add button at bottom */}
            <Form method="post" style={{ marginBottom: "20px" }} onSubmit={(e) => {
              setTimeout(() => {
                (e.target as HTMLFormElement).reset();
                setRecurrence("NONE");
                setShowFullForm(false);
              }, 0);
            }}>
              <input type="hidden" name="intent" value="create" />
              <input
                id="title"
                name="title"
                aria-label="Add task title"
                placeholder="Add a new task…"
                className="add-input"
                autoCapitalize="sentences"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length === 1 && val[0] !== val[0].toUpperCase()) {
                    e.target.value = val[0].toUpperCase() + val.slice(1);
                  }
                }}
              />

              <button
                type="button"
                className="expand-btn"
                onClick={() => setShowFullForm(v => !v)}
              >
                {showFullForm ? "▲ Hide options" : "▼ Set priority & due date"}
              </button>

              {showFullForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                  <div className="extra-fields">
                    <div>
                      <label className="field-label" htmlFor="priority">Priority</label>
                      <select id="priority" name="priority" className="field-select" defaultValue="MEDIUM">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="recurrence">Repeat</label>
                      <select
                        id="recurrence"
                        name="recurrence"
                        className="field-select"
                        defaultValue="NONE"
                        onChange={(e) => setRecurrence(e.target.value)}
                      >
                        <option value="NONE">No repeat</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* Show due date for one-off, start+end for recurring */}
                  {recurrence === "NONE" ? (
                    <div className="extra-fields">
                      <div>
                        <label className="field-label" htmlFor="dueDate">Due Date</label>
                        <input id="dueDate" type="date" name="dueDate" className="field-date" />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="notes">Notes</label>
                        <input id="notes" name="notes" className="field-date" placeholder="Optional notes…" />
                      </div>
                    </div>
                  ) : recurrence === "WEEKLY" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="extra-fields">
                        <div>
                          <label className="field-label" htmlFor="startWeek">Start Week</label>
                          <input id="startWeek" type="week" name="startWeek" className="field-date" />
                        </div>
                        <div>
                          <label className="field-label" htmlFor="endWeek">End Week</label>
                          <input id="endWeek" type="week" name="endWeek" className="field-date" />
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="notes">Notes</label>
                        <input id="notes" name="notes" className="field-date" placeholder="Optional notes…" />
                      </div>
                    </div>
                  ) : recurrence === "MONTHLY" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="extra-fields">
                        <div>
                          <label className="field-label" htmlFor="startMonth">Start Month</label>
                          <input id="startMonth" type="month" name="startMonth" className="field-date" />
                        </div>
                        <div>
                          <label className="field-label" htmlFor="endMonth">End Month</label>
                          <input id="endMonth" type="month" name="endMonth" className="field-date" />
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="notes">Notes</label>
                        <input id="notes" name="notes" className="field-date" placeholder="Optional notes…" />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="extra-fields">
                        <div>
                          <label className="field-label" htmlFor="startDate">Start Date</label>
                          <input id="startDate" type="date" name="startDate" className="field-date" />
                        </div>
                        <div>
                          <label className="field-label" htmlFor="endDate">End Date</label>
                          <input id="endDate" type="date" name="endDate" className="field-date" />
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="notes">Notes</label>
                        <input id="notes" name="notes" className="field-date" placeholder="Optional notes…" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="add-btn">+ Add Task</button>
            </Form>

            {/* LIVE SEARCH */}
            <div className="search-row">
              <input
                ref={searchRef}
                id="search"
                defaultValue={search}
                aria-label="Search tasks"
                placeholder="Search tasks…"
                className="search-input"
                onChange={handleSearchChange}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    if (searchRef.current) searchRef.current.value = "";
                    submit(filter !== "all" ? new URLSearchParams({ filter }) : new URLSearchParams(), { method: "get", action: "/" });
                  }}
                >
                  ×
                </button>
              )}
            </div>

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

            {/* GROUPED LIST */}
            {(() => {
              const totalTodos = todos.length;
              const hiddenCount = totalTodos - GLOBAL_VISIBLE;
              let shownSoFar = 0;

              const groupsWithVisibleTodos = groups.map((group) => {
                const groupTodos = showMoreTasks
                  ? group.todos
                  : group.todos.filter(() => {
                      if (shownSoFar >= GLOBAL_VISIBLE) return false;
                      shownSoFar++;
                      return true;
                    });
                return { ...group, visibleTodos: groupTodos };
              });

              return groups.length === 0 ? (
              <p className="todo-empty">
                {search ? `No tasks matching "${search}"` : "Nothing here yet."}
              </p>
            ) : (
                  <>
                    {groupsWithVisibleTodos.map((group) => {
                      const groupTodos = group.visibleTodos;
                      if (groupTodos.length === 0) return null;

                      return (
                        <div key={group.label}>
                          <div style={{
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em",
                            textTransform: "uppercase", color: "var(--text-muted)",
                            padding: "8px 14px 6px", marginTop: "8px",
                          }}>
                            {group.label}
                          </div>
                          <ul className="todo-list">
                            {groupTodos.map((todo) => {
                        const due = formatDueDate(todo.dueDate, todo.recurrence, todo.startDate, todo.endDate);
                        const subtasks = Array.isArray(todo.subtasks)
                          ? (todo.subtasks as Array<{ id: string; title: string; done: boolean }>)
                          : [];
                        return (
                          <li key={todo.id} className="todo-item">
                            {editingId === todo.id ? (
                              <Form method="post" className="edit-form" onSubmit={() => setEditingId(null)}>
                                <input type="hidden" name="intent" value="edit" />
                                <input type="hidden" name="id" value={todo.id} />
                                <input
                                  name="title"
                                  defaultValue={todo.title}
                                  autoFocus
                                  aria-label="Edit task title"
                                  className="edit-input"
                                />
                                <button type="submit" className="save-btn">Save</button>
                                <button type="button" className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                              </Form>
                            ) : (
                              <div>
                                <div className="todo-view">
                                  <Form method="post">
                                    <input type="hidden" name="intent" value="toggle" />
                                    <input type="hidden" name="id" value={todo.id} />
                                    <input type="hidden" name="done" value={String(todo.done)} />
                                    <button
                                      type="submit"
                                      className={`toggle-btn${todo.done ? " done" : ""}${isFutureDueDate(todo.dueDate) && !todo.done ? " disabled" : ""}`}
                                      disabled={isFutureDueDate(todo.dueDate) && !todo.done}
                                      aria-label={todo.done ? "Mark task incomplete" : "Mark task complete"}
                                    >✓</button>
                                  </Form>

                                  <div className="todo-content">
                                    <div className="todo-title-row">
                                      <span className={`todo-title${todo.done ? " done" : ""}`}>{todo.title}</span>
                                      <PriorityBadge priority={todo.priority} />
                                      {todo.recurrence !== "NONE" && (
                                        <span style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 600 }}>
                                          🔁 {String(todo.recurrence).toLowerCase()}
                                        </span>
                                      )}
                                    </div>
                                    {todo.notes && (
                                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                                        {todo.notes}
                                      </p>
                                    )}
                                    <div className="todo-meta">
                                      {todo.done
                                        ? <span className="todo-date-text" style={{ color: "#6B7280" }}>✓ Completed</span>
                                        : due && <span className="todo-date-text" style={{ color: due.color }}>{due.text}</span>
                                      }
                                      <span className="todo-created">Added {new Date(todo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                      {subtasks.length > 0 && (
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                          {subtasks.filter(s => s.done).length}/{subtasks.length} subtasks
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="todo-actions">
                                    <button type="button" className="action-btn" onClick={() => setExpandedId(expandedId === todo.id ? null : todo.id)}>
                                      {expandedId === todo.id ? "▲" : "▼"}
                                    </button>
                                    <a href={`/todos/${todo.id}/edit`} className="action-btn">Edit</a>
                                    <button type="button" className="action-btn delete" onClick={() => setDeleteConfirmId(todo.id)}>Delete</button>
                                  </div>
                                </div>

                                {/* SUBTASKS */}
                                {expandedId === todo.id && (
                                  <div style={{ marginLeft: "36px", marginTop: "8px", paddingBottom: "8px" }}>
                                    {subtasks.map((sub) => (
                                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                                        <Form method="post">
                                          <input type="hidden" name="intent" value="toggle-subtask" />
                                          <input type="hidden" name="id" value={sub.id} />
                                          <input type="hidden" name="done" value={String(sub.done)} />
                                          <button
                                            type="submit"
                                            className={`toggle-btn${sub.done ? " done" : ""}`}
                                            style={{ width: "16px", height: "16px", fontSize: "9px" }}
                                            aria-label={sub.done ? "Mark subtask incomplete" : "Mark subtask complete"}
                                          >✓</button>
                                        </Form>
                                        <span style={{ fontSize: "13px", color: sub.done ? "var(--text-faint)" : "var(--text-primary)", textDecoration: sub.done ? "line-through" : "none", flex: 1 }}>
                                          {sub.title}
                                        </span>
                                        <Form method="post">
                                          <input type="hidden" name="intent" value="delete-subtask" />
                                          <input type="hidden" name="id" value={sub.id} />
                                          <button
                                            type="submit"
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "12px" }}
                                            aria-label="Delete subtask"
                                          >×</button>
                                        </Form>
                                      </div>
                                    ))}
                                    <Form method="post" style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                                      <input type="hidden" name="intent" value="add-subtask" />
                                      <input type="hidden" name="todoId" value={todo.id} />
                                      <input
                                        id={`subtask-${todo.id}`}
                                        name="subtaskTitle"
                                        aria-label="Add subtask title"
                                        placeholder="Add subtask…"
                                        className="edit-input"
                                        style={{ fontSize: "12px", padding: "6px 10px" }}
                                      />
                                      <button type="submit" className="save-btn" style={{ fontSize: "12px", padding: "6px 12px" }}>Add</button>
                                    </Form>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                          </ul>
                        </div>
                      );
                    })}

                    {/* UNIVERSAL SEE MORE */}
                    {!showMoreTasks && hiddenCount > 0 && (
                      <button
                        type="button"
                        className="see-more-btn"
                        onClick={() => setShowMoreTasks(true)}
                      >
                        ▼ See {hiddenCount} more task{hiddenCount !== 1 ? "s" : ""}
                      </button>
                    )}
                    {showMoreTasks && totalTodos > GLOBAL_VISIBLE && (
                      <button
                        type="button"
                        className="see-more-btn"
                        onClick={() => setShowMoreTasks(false)}
                      >
                        ▲ Show less
                      </button>
                    )}
                  </>
              );
            })()}

            {/* SHOW ALL OLDER BUTTON */}
            {hasOlder && !showAll && (
              <a
                href={`?${new URLSearchParams({ filter, search, showAll: "true" }).toString()}`}
                style={{
                  display: "block", textAlign: "center", marginTop: "16px",
                  padding: "10px", borderRadius: "10px", border: "1px dashed var(--border)",
                  fontSize: "13px", color: "var(--text-muted)", textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                Show older tasks
              </a>
            )}
          </div>
        </div>

        <footer className="page-footer">
          Built with <span>Remix</span> · <span>NestJS</span> · <span>PostgreSQL</span>
        </footer>
      </div>

      {deleteConfirmId ? (
        <div className="modal-overlay">
          <div className="delete-modal">
            <p>
              Are you sure you want to delete "{selectedDeleteTodo?.title ?? "this task"}"?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <Form method="post" onSubmit={() => setDeleteConfirmId(null)}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirmId} />
                <button type="submit" className="confirm-btn">Yes, delete</button>
              </Form>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}