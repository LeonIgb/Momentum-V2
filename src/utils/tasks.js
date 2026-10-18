// Task/project sanitizers for saved data (tolerates missing or malformed fields).
import { PROJECT_COLORS, OFFSETS } from '../constants';
import { validDate } from './dates';

export const seedData = () => ({ projects: [], tasks: [] }); // starts empty: no demo data
export const cleanTasks = (a) => (Array.isArray(a) ? a : []).filter((x) => x && typeof x.id === 'string' && typeof x.title === 'string').map((x) => ({
  id: x.id, title: x.title, description: typeof x.description === 'string' ? x.description : '', completed: !!x.completed,
  priority: [1, 2, 3, 4].includes(x.priority) ? x.priority : 4, dueDate: typeof x.dueDate === 'string' && validDate(x.dueDate) ? x.dueDate : null,
  projectId: typeof x.projectId === 'string' ? x.projectId : null, labels: Array.isArray(x.labels) ? x.labels.filter((l) => typeof l === 'string') : [],
  createdAt: Number(x.createdAt) || Date.now(), completedAt: x.completedAt ? Number(x.completedAt) : null,
  dueTime: validDate(String(x.dueDate)) && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(x.dueTime)) ? x.dueTime : null,
  reminderEnabled: !!x.reminderEnabled, reminderMinutesBefore: OFFSETS.some((o) => o[0] === x.reminderMinutesBefore) ? x.reminderMinutesBefore : 0,
}));
export const cleanProjects = (a) => (Array.isArray(a) ? a : []).filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string').map((x) => ({ id: x.id, name: x.name, color: x.color || PROJECT_COLORS[0], createdAt: Number(x.createdAt) || Date.now() }));
