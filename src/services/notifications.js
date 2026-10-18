// Local notification service (expo-notifications). Local reminders only; no remote push.
import { LogBox, Platform } from 'react-native';
import { fmtDate, fmtTime, fireAt } from '../utils/dates';

LogBox.ignoreLogs(['expo-notifications']);
export const Notifications = require('expo-notifications');

export const NOTIF_OK = Platform.OS !== 'web';

export const TT = NOTIF_OK && Notifications.SchedulableTriggerInputTypes;
export const dateTrig = (date, channelId) => (TT ? { type: TT.DATE, date, channelId } : { date, channelId });
export const secTrig = (seconds, channelId) => (TT ? { type: TT.TIME_INTERVAL, seconds, channelId } : { seconds, channelId });
export const chan = (sound) => (sound ? 'momentum-sound' : 'momentum-silent');
if (NOTIF_OK) {
  try {
    Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  } catch (e) { /* handler unsupported: reminders still work in background */ }
}
export async function setupChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('momentum-sound', { name: 'Task reminders', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  await Notifications.setNotificationChannelAsync('momentum-silent', { name: 'Silent reminders', importance: Notifications.AndroidImportance.DEFAULT, sound: null });
}
// Adopt notifications already scheduled with the OS (survives app reloads) and cancel duplicates.
export async function loadScheduled(map) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    const d = n.content && n.content.data;
    if (!d || !d.taskId) continue;
    if (map[d.taskId]) { try { await Notifications.cancelScheduledNotificationAsync(n.identifier); } catch (e) {} }
    else map[d.taskId] = { nid: n.identifier, key: d.key };
  }
}
// Make the OS schedule match the tasks exactly: cancel stale/removed/completed, schedule missing. Returns failure count.
export async function reconcile(tasks, on, sound, map) {
  const want = {};
  if (on) tasks.forEach((t) => { const f = fireAt(t); if (!t.completed && f && f > new Date()) want[t.id] = { t, f, key: `${f.getTime()}${sound ? 's' : 'q'}` }; });
  for (const id of Object.keys(map)) {
    if (!want[id] || want[id].key !== map[id].key) { try { await Notifications.cancelScheduledNotificationAsync(map[id].nid); } catch (e) {} delete map[id]; }
  }
  let failed = 0;
  for (const id of Object.keys(want)) {
    if (map[id]) continue;
    const { t, f, key } = want[id];
    try {
      const nid = await Notifications.scheduleNotificationAsync({
        content: { title: t.title, body: t.reminderMinutesBefore ? `Due ${fmtDate(t.dueDate)} at ${fmtTime(t.dueTime)}` : 'Due now', sound, data: { taskId: id, key } },
        trigger: dateTrig(f, chan(sound)),
      });
      map[id] = { nid, key }; // saved only after scheduling succeeded
    } catch (e) { failed++; }
  }
  return failed;
}
