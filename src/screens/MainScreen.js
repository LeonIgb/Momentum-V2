import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, SectionList, ScrollView, Keyboard, StatusBar, ActivityIndicator, Platform, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PRI, LIGHT, DARK, VERSION, OFFSETS, DEMO_TITLES } from '../constants';
import { uid, todayStr, addDays, fmtDate, dayOf, isOverdue } from '../utils/dates';
import { cleanTasks, cleanProjects, seedData } from '../utils/tasks';
import { readRaw, writeRaw } from '../services/storage';
import { NOTIF_OK, Notifications, secTrig, chan, setupChannels, loadScheduled, reconcile } from '../services/notifications';
import { makeStyles } from '../theme/styles';
import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { TaskRow } from '../components/TaskRow';
import { Empty } from '../components/Empty';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';
import { Confirm } from '../components/Confirm';
import BottomTabBar from '../navigation/BottomTabBar';
import ProjectsScreen from './ProjectsScreen';
import SettingsScreen from './SettingsScreen';

export default function MainScreen({ onLoaded }) {
  const system = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);
  const [storeError, setStoreError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [themePref, setThemePref] = useState('system');
  const [tab, setTab] = useState('today');
  const [openProject, setOpenProject] = useState(null);
  const [quick, setQuick] = useState('');
  const [query, setQuery] = useState('');
  const [fPri, setFPri] = useState(0);
  const [fProj, setFProj] = useState(null);
  const [sort, setSort] = useState('due');
  const [showDone, setShowDone] = useState(false);
  const [taskModal, setTaskModal] = useState({ visible: false, task: null });
  const [projModal, setProjModal] = useState({ visible: false, project: null });
  const [conf, setConf] = useState(null);
  const [settings, setSettings] = useState({ remindersOn: true, defaultOffset: 0, soundOn: true });
  const [perm, setPerm] = useState(NOTIF_OK ? 'unknown' : 'unsupported');
  const [notice, setNotice] = useState('');
  const schedMap = useRef({});
  const syncChain = useRef(Promise.resolve());
  const mapReady = useRef(false);

  const dark = themePref === 'system' ? system === 'dark' : themePref === 'dark';
  const c = dark ? DARK : LIGHT;
  const s = useMemo(() => makeStyles(c, insets), [dark, insets.top, insets.bottom]);
  s.accent = c.accent;

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const raw = await readRaw();
        if (raw) {
          const d = JSON.parse(raw);
          let tl = cleanTasks(d.tasks); let pl = cleanProjects(d.projects);
          if (!d.demoPurged) { // one-time removal of the old sample tasks and the empty sample projects
            tl = tl.filter((t) => !DEMO_TITLES.includes(t.title));
            pl = pl.filter((x) => !(['Work', 'Personal'].includes(x.name) && !tl.some((t) => t.projectId === x.id)));
          }
          setTasks(tl); setProjects(pl);
          if (['system', 'light', 'dark'].includes(d.theme)) setThemePref(d.theme);
          if (d.settings && typeof d.settings === 'object') setSettings((p) => ({ ...p, ...d.settings }));
        } else {
          const d = seedData(); setTasks(d.tasks); setProjects(d.projects);
        }
      } catch (e) {
        setStoreError('Saved data could not be read. Starting fresh.');
        const d = seedData(); setTasks(d.tasks); setProjects(d.projects);
      } finally { setLoaded(true); if (onLoaded) onLoaded(); }
    })();
  }, []);

  /* save (only after initial load so we never overwrite saved data) */
  useEffect(() => {
    if (!loaded) return;
    writeRaw(JSON.stringify({ tasks, projects, theme: themePref, settings, demoPurged: true }))
      .then(() => setStoreError(''))
      .catch(() => setStoreError('Changes could not be saved on this device.'));
  }, [tasks, projects, themePref, settings, loaded]);

  /* notifications: permission status + channels (no permission prompt at startup) */
  useEffect(() => {
    if (!NOTIF_OK) return;
    (async () => {
      try {
        try { await setupChannels(); } catch (e) { setNotice('Android channel setup failed: ' + (e && e.message ? e.message : String(e))); }
        const p = await Notifications.getPermissionsAsync();
        setPerm(p.granted ? 'granted' : p.canAskAgain === false ? 'denied' : 'undetermined');
      } catch (e) { setPerm('unsupported'); setNotice('Notifications unavailable on ' + Platform.OS + ': ' + (e && e.message ? e.message : String(e))); }
    })();
  }, []);

  /* reminders: serialized reconcile on startup and after every relevant change (no duplicates) */
  useEffect(() => {
    if (!loaded || !NOTIF_OK || perm === 'unsupported' || perm === 'unknown') return;
    syncChain.current = syncChain.current.then(async () => {
      if (!mapReady.current) { await loadScheduled(schedMap.current); mapReady.current = true; }
      const failed = await reconcile(tasks, settings.remindersOn && perm === 'granted', settings.soundOn, schedMap.current);
      if (failed) setNotice(`${failed} reminder(s) could not be scheduled.`);
    }).catch(() => setNotice('Reminders could not be updated on this device.'));
  }, [tasks, settings.remindersOn, settings.soundOn, perm, loaded]);

  const projById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  /* actions */
  const createTask = (data) => setTasks((prev) => [{ id: uid(), completed: false, createdAt: Date.now(), completedAt: null, description: '', labels: [], dueTime: null, reminderEnabled: false, reminderMinutesBefore: 0, ...data }, ...prev]);
  const updateTask = (id, patch) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const toggle = (t) => updateTask(t.id, { completed: !t.completed, completedAt: t.completed ? null : Date.now() });
  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const quickDefaults = () => ({
    dueDate: tab === 'today' ? todayStr() : tab === 'upcoming' ? addDays(1) : null,
    projectId: tab === 'projects' && openProject ? openProject : null,
    reminderMinutesBefore: settings.defaultOffset,
  });
  const quickAdd = () => {
    const title = quick.trim();
    if (!title) return;
    createTask({ title, priority: 4, ...quickDefaults() });
    setQuick('');
  };
  const openNew = () => setTaskModal({ visible: true, task: null });
  const closeTask = () => setTaskModal({ visible: false, task: null });
  const saveTask = (data) => {
    if (taskModal.task) updateTask(taskModal.task.id, data); else createTask(data);
    if (data.reminderEnabled && settings.remindersOn && perm !== 'granted' && perm !== 'unsupported') askPerm();
    closeTask();
  };
  const askDeleteTask = () => {
    const t = taskModal.task;
    setConf({ title: 'Delete task?', message: `"${t.title}" will be permanently removed.`, okLabel: 'Delete', onOk: () => { removeTask(t.id); closeTask(); } });
  };
  const saveProject = (name, color) => {
    if (projModal.project) setProjects((p) => p.map((x) => (x.id === projModal.project.id ? { ...x, name, color } : x)));
    else setProjects((p) => [...p, { id: uid(), name, color, createdAt: Date.now() }]);
    setProjModal({ visible: false, project: null });
  };
  const askDeleteProject = (p) => setConf({
    title: 'Delete project?', okLabel: 'Delete',
    message: `"${p.name}" will be removed. Its tasks are kept and moved out of the project.`,
    onOk: () => {
      setTasks((prev) => prev.map((t) => (t.projectId === p.id ? { ...t, projectId: null } : t)));
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      setOpenProject(null);
    },
  });

  const askPerm = async () => {
    if (!NOTIF_OK) return false;
    try {
      const r = await Notifications.requestPermissionsAsync();
      setPerm(r.granted ? 'granted' : r.canAskAgain === false ? 'denied' : 'undetermined');
      return r.granted;
    } catch (e) { setNotice('Could not request notification permission.'); return false; }
  };
  const testNotif = async () => {
    if (!NOTIF_OK) { setNotice('This is the web preview, which cannot show notifications. Open the app in Expo Go on a phone.'); return; }
    if (perm === 'unsupported') { setNotice('Notifications failed to start on ' + Platform.OS + '. See the earlier error message in this banner.'); return; }
    if (perm !== 'granted' && !(await askPerm())) { setNotice('Allow notifications first to send a test.'); return; }
    try {
      await Notifications.scheduleNotificationAsync({ content: { title: 'Momentum 2.0', body: 'Test reminder. Your device sound should play.', sound: settings.soundOn }, trigger: secTrig(5, chan(settings.soundOn)) });
      setConf({ title: 'Test scheduled', message: 'A notification will arrive in about 5 seconds. Lock your phone or switch apps to see a real background reminder.', okLabel: 'OK', onOk: () => {} });
    } catch (e) { setNotice('The test notification could not be scheduled.'); }
  };
  const permText = { granted: 'Allowed. Reminders can notify you when Momentum is closed.', denied: 'Blocked. Enable notifications for Momentum (Expo Go while testing) in your device settings.', undetermined: 'Not allowed yet. Tap Allow notifications.', unknown: 'Checking...', unsupported: 'Not available in this preview. Use Expo Go on iOS or Android.' }[perm];

  /* filtering + sorting */
  const q = query.trim().toLowerCase();
  const filterFn = (t) => {
    if (fPri && t.priority !== fPri) return false;
    if (fProj && t.projectId !== fProj) return false;
    if (q) {
      const pn = t.projectId && projById[t.projectId] ? projById[t.projectId].name.toLowerCase() : '';
      if (!(t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || pn.includes(q))) return false;
    }
    return true;
  };
  const sortFn = (a, b) => {
    if (sort === 'priority') return a.priority - b.priority || a.createdAt - b.createdAt;
    if (sort === 'created') return b.createdAt - a.createdAt;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99') || a.priority - b.priority;
  };

  const today = todayStr();
  const sections = useMemo(() => {
    const list = tasks.filter(filterFn);
    const act = list.filter((t) => !t.completed).sort(sortFn);
    const done = list.filter((t) => t.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const out = [];
    const add = (title, data) => data.length && out.push({ title, data });
    if (tab === 'today') {
      add('Overdue', act.filter(isOverdue));
      add('Today', act.filter((t) => t.dueDate === today && !isOverdue(t)));
      add('Done today', done.filter((t) => dayOf(t.completedAt) === today));
    } else if (tab === 'upcoming') {
      const fut = act.filter((t) => t.dueDate && t.dueDate > today);
      [...new Set(fut.map((t) => t.dueDate))].sort().forEach((d) => add(fmtDate(d), fut.filter((t) => t.dueDate === d)));
      if (showDone) add('Completed', done.filter((t) => t.dueDate && t.dueDate > today));
    } else if (tab === 'inbox') {
      add('Inbox', act.filter((t) => !t.dueDate && !t.projectId));
      if (showDone) add('Completed', done.filter((t) => !t.dueDate && !t.projectId));
    } else if (tab === 'projects' && openProject) {
      add('To do', act.filter((t) => t.projectId === openProject));
      add('Completed', done.filter((t) => t.projectId === openProject));
    }
    return out;
  }, [tasks, tab, openProject, q, fPri, fProj, sort, showDone, projById]);

  /* progress for Today */
  const activeToday = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= today).length;
  const doneToday = tasks.filter((t) => t.completed && dayOf(t.completedAt) === today).length;
  const totalToday = activeToday + doneToday;
  const overdueCount = tasks.filter(isOverdue).length;
  const needPerm = settings.remindersOn && ['denied', 'undetermined'].includes(perm) && tasks.some((t) => !t.completed && t.reminderEnabled);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();
  const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (!loaded) return <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.accent} size="large" /></View>;

  /* header pieces */
  const cycle = (arr, cur, set) => set(arr[(arr.indexOf(cur) + 1) % arr.length]);
  const projName = fProj && projById[fProj] ? projById[fProj].name : 'All projects';
  const currentProject = openProject ? projById[openProject] : null;

  const ListHeader = (
    <View>
      {tab === 'projects' && currentProject ? (
        <View style={s.headRow}>
          <Pressable onPress={() => setOpenProject(null)} hitSlop={10} accessibilityLabel="Back to projects"><Ionicons name="chevron-back" size={26} color={c.text} /></Pressable>
          <Text style={[s.h1, { flex: 1, marginLeft: 6 }]} numberOfLines={1}>{currentProject.name}</Text>
          <Pressable onPress={() => setProjModal({ visible: true, project: currentProject })} hitSlop={10} accessibilityLabel="Rename project"><Ionicons name="create-outline" size={22} color={c.text} /></Pressable>
          <Pressable onPress={() => askDeleteProject(currentProject)} hitSlop={10} accessibilityLabel="Delete project" style={{ marginLeft: 16 }}><Ionicons name="trash-outline" size={22} color={c.danger} /></Pressable>
        </View>
      ) : (
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.h1}>{tab === 'today' ? greeting : tab === 'upcoming' ? 'Upcoming' : 'Inbox'}</Text>
            <Text style={s.sub}>{dateText} · Momentum {VERSION}</Text>
          </View>
          <Pressable onPress={() => setTab('settings')} hitSlop={10} accessibilityLabel="Open settings" style={s.avatar}>
            <Ionicons name="person" size={18} color={c.accent} />
          </Pressable>
        </View>
      )}

      {tab === 'today' && (
        <View style={[s.card, { padding: 16, marginBottom: 12 }]}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Daily progress</Text>
            <Text style={s.sub}>{doneToday} of {totalToday} done</Text>
          </View>
          <ProgressBar s={s} value={totalToday ? doneToday / totalToday : 0} />
          <Text style={[s.sub, { marginTop: 8 }]}>
            {totalToday === 0 ? 'Nothing planned yet.' : activeToday === 0 ? 'All clear. Nice work.' : `${activeToday} left to go.`}{overdueCount > 0 && <Text style={{ color: c.danger, fontWeight: '600' }}>  {overdueCount} overdue</Text>}
          </Text>
        </View>
      )}
      {tab === 'projects' && currentProject && (() => {
        const pt = tasks.filter((t) => t.projectId === currentProject.id);
        const pd = pt.filter((t) => t.completed).length;
        return (
          <View style={[s.card, { padding: 16, marginBottom: 12 }]}>
            <View style={s.rowBetween}><Text style={s.cardTitle}>Project progress</Text><Text style={s.sub}>{pd} of {pt.length} done</Text></View>
            <ProgressBar s={s} value={pt.length ? pd / pt.length : 0} color={currentProject.color} />
          </View>
        );
      })()}

      <View style={[s.card, s.row, { paddingVertical: 4 }]}>
        <Ionicons name="add-circle" size={24} color={c.accent} />
        <TextInput style={s.quickInput} placeholder="Add a task" placeholderTextColor={c.sub} value={quick}
          onChangeText={setQuick} onSubmitEditing={quickAdd} returnKeyType="done" blurOnSubmit={false} />
      </View>

      <View style={[s.card, s.row, { paddingVertical: 4, marginTop: 10 }]}>
        <Ionicons name="search" size={18} color={c.sub} />
        <TextInput style={s.quickInput} placeholder="Search tasks, notes, projects" placeholderTextColor={c.sub} value={query} onChangeText={setQuery} />
        {!!query && <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search"><Ionicons name="close-circle" size={18} color={c.sub} /></Pressable>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 4 }} contentContainerStyle={{ gap: 8 }}>
        <Chip s={s} label={fPri ? PRI[fPri].label : 'Any priority'} active={!!fPri} color={fPri ? PRI[fPri].color : undefined} onPress={() => cycle([0, 1, 2, 3, 4], fPri, setFPri)} />
        <Chip s={s} label={projName} active={!!fProj} onPress={() => cycle([null, ...projects.map((p) => p.id)], fProj, setFProj)} />
        <Chip s={s} label={`Sort: ${sort === 'due' ? 'due date' : sort}`} onPress={() => cycle(['due', 'priority', 'created'], sort, setSort)} />
        {tab !== 'today' && <Chip s={s} label="Show completed" active={showDone} onPress={() => setShowDone((v) => !v)} />}
      </ScrollView>
    </View>
  );

  const emptyText = {
    today: ['sunny-outline', 'A clear day', 'Nothing is due today. Add a task above to plan your day.'],
    upcoming: ['calendar-outline', 'Nothing scheduled', 'Tasks with a future due date will show up here, grouped by day.'],
    inbox: ['file-tray-outline', 'Inbox is empty', 'Tasks without a date or project land here. Capture something above.'],
    projects: ['folder-open-outline', 'No tasks here', 'Add a task above and it will join this project.'],
  }[tab] || [];

  const renderTasks = tab !== 'settings' && !(tab === 'projects' && !openProject);

  return (
    <View style={s.screen}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {!!(storeError || notice || needPerm) && (
        <Pressable style={s.banner} onPress={() => setNotice('')}>
          <Text style={{ color: '#fff', fontSize: 13 }}>{storeError || notice || 'Notifications are not allowed, so reminders will not fire. See Settings > Reminders.'}</Text>
        </Pressable>
      )}

      {renderTasks && (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={s.listPad}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<Empty s={s} c={c} icon={emptyText[0]} title={q || fPri || fProj ? 'No matches' : emptyText[1]} text={q || fPri || fProj ? 'Try a different search or clear a filter.' : emptyText[2]} />}
          renderSectionHeader={({ section }) => (
            <Text style={[s.sectionTitle, section.title === 'Overdue' && { color: c.danger }]}>{section.title} <Text style={{ fontWeight: '400' }}>{section.data.length}</Text></Text>
          )}
          renderItem={({ item }) => (
            <TaskRow task={item} project={projById[item.projectId]} s={s} c={c} onToggle={() => toggle(item)} onPress={() => setTaskModal({ visible: true, task: item })} />
          )}
        />
      )}

      {tab === 'projects' && !openProject && (
        <ProjectsScreen s={s} c={c} projects={projects} tasks={tasks} setProjModal={setProjModal} setOpenProject={setOpenProject} setQuery={setQuery} setFPri={setFPri} setFProj={setFProj} />
      )}

      {tab === 'settings' && (
        <SettingsScreen s={s} c={c} themePref={themePref} setThemePref={setThemePref} settings={settings} setSettings={setSettings} perm={perm} askPerm={askPerm} permText={permText} testNotif={testNotif} setNotice={setNotice} setConf={setConf} setTasks={setTasks} setProjects={setProjects} setOpenProject={setOpenProject} tasks={tasks} projects={projects} />
      )}

      {renderTasks && (
        <Pressable style={s.fab} onPress={openNew} accessibilityRole="button" accessibilityLabel="Add task with details">
          <Ionicons name="create" size={24} color={c.onAccent} />
        </Pressable>
      )}

      <BottomTabBar tab={tab} setTab={setTab} s={s} c={c} />

      <TaskModal visible={taskModal.visible} task={taskModal.task} defaults={quickDefaults()} projects={projects} onSave={saveTask} onDelete={askDeleteTask} onClose={closeTask} s={s} c={c} />
      <ProjectModal visible={projModal.visible} project={projModal.project} onSave={saveProject} onClose={() => setProjModal({ visible: false, project: null })} s={s} c={c} />
      <Confirm conf={conf} onClose={() => setConf(null)} s={s} c={c} />
    </View>
  );
}
