// Date/time helpers. Dates are local YYYY-MM-DD, times are local HH:MM.
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
export const pad = (n) => String(n).padStart(2, '0');
export const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date());
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toStr(d); };
export const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseDate(s).getTime()) && toStr(parseDate(s)) === s;
export const fmtDate = (s) => {
  if (!s) return '';
  if (s === todayStr()) return 'Today';
  if (s === addDays(1)) return 'Tomorrow';
  return parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
export const dayOf = (ts) => (ts ? toStr(new Date(ts)) : null);
export const fmtTime = (hm) => { if (!hm) return ''; const [h, m] = hm.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`; };
// Due date (YYYY-MM-DD) + due time (HH:MM) are stored as local wall-clock values and combined into a local Date.
export const dueAt = (t) => { if (!t.dueDate || !t.dueTime) return null; const [y, mo, d] = t.dueDate.split('-').map(Number); const [h, mi] = t.dueTime.split(':').map(Number); return new Date(y, mo - 1, d, h, mi, 0, 0); };
export const fireAt = (t) => { const d = dueAt(t); return d && t.reminderEnabled ? new Date(d.getTime() - t.reminderMinutesBefore * 60000) : null; };
export const isOverdue = (t) => { if (t.completed || !t.dueDate) return false; const d = dueAt(t); return d ? d < new Date() : t.dueDate < todayStr(); };
