// Shared helpers for converting between JS Date objects and the values
// produced by <input type="week"> ("YYYY-Www") and <input type="month"> ("YYYY-MM").
// Client-safe (no server-only imports) so it can be used in both loaders/actions
// and components.

export function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export function dateToWeekValue(date: Date) {
  const { year, week } = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekValueToDate(weekValue: string, endOfWeek = false) {
  const [yearStr, weekStr] = weekValue.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  if (endOfWeek) monday.setUTCDate(monday.getUTCDate() + 6);
  return monday;
}

export function dateToMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthValueToDate(monthValue: string, endOfMonth = false) {
  const [year, month] = monthValue.split("-").map(Number);
  if (endOfMonth) return new Date(Date.UTC(year, month, 0)); // last day of that month
  return new Date(Date.UTC(year, month - 1, 1));
}