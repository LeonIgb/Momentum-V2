import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';
import { Chip } from './Chip';
import { TimeStepper } from './TimeStepper';

export function TaskModal({ visible, task, defaults, projects, onSave, onDelete, onClose, s, c }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState('');
  const [pri, setPri] = useState(4);
  const [proj, setProj] = useState(null);
  const [time, setTime] = useState('');
  const [remOn, setRemOn] = useState(false);
  const [remOff, setRemOff] = useState(0);
  const [labels, setLabels] = useState('');
  const [err, setErr] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (!visible) return;
    busy.current = false;
    const t = task || defaults || {};
    setTitle(t.title || ''); setDesc(t.description || ''); setDue(t.dueDate || '');
    setPri(t.priority || 4); setProj(t.projectId || null); setTime(t.dueTime || ''); setRemOn(!!t.reminderEnabled); setRemOff(t.reminderMinutesBefore || 0); setLabels((t.labels || []).join(', ')); setErr('');
  }, [visible, task, defaults]);

  const save = () => {
    if (busy.current) return;
    if (!title.trim()) { setErr('Give your task a title.'); return; }
    if (due && !validDate(due)) { setErr('Use the date format YYYY-MM-DD, or pick a shortcut.'); return; }
    if (time && !due) { setErr('Pick a due date for the time you set.'); return; }
    if (remOn && time && !(task && task.completed)) {
      const fa = fireAt({ dueDate: due, dueTime: time, reminderEnabled: true, reminderMinutesBefore: remOff });
      if (fa <= new Date()) { setErr('That reminder time has already passed. Move the due time later or choose a shorter reminder offset.'); return; }
    }
    busy.current = true;
    Keyboard.dismiss();
    onSave({
      title: title.trim(), description: desc.trim(), dueDate: due || null, priority: pri, projectId: proj, dueTime: time || null, reminderEnabled: remOn && !!time, reminderMinutesBefore: remOff,
      labels: labels.split(',').map((l) => l.trim().replace(/^#/, '')).filter(Boolean),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Pressable onPress={onClose} hitSlop={10}><Text style={s.link}>Cancel</Text></Pressable>
            <Text style={s.sheetTitle}>{task ? 'Edit task' : 'New task'}</Text>
            <Pressable onPress={save} hitSlop={10}><Text style={[s.link, { fontWeight: '700' }]}>Save</Text></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 12 }}>
            <TextInput style={s.inputBig} placeholder="Task title" placeholderTextColor={c.sub} value={title} onChangeText={setTitle} autoFocus={!task} />
            <TextInput style={[s.input, { minHeight: 64, textAlignVertical: 'top' }]} placeholder="Description (optional)" placeholderTextColor={c.sub} value={desc} onChangeText={setDesc} multiline />
            <Text style={s.label}>Due date</Text>
            <View style={s.chipRow}>
              <Chip s={s} label="Today" active={due === todayStr()} onPress={() => setDue(todayStr())} />
              <Chip s={s} label="Tomorrow" active={due === addDays(1)} onPress={() => setDue(addDays(1))} />
              <Chip s={s} label="Next week" active={due === addDays(7)} onPress={() => setDue(addDays(7))} />
              <Chip s={s} label="No date" active={!due} onPress={() => setDue('')} />
            </View>
            <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor={c.sub} value={due} onChangeText={setDue} autoCapitalize="none" maxLength={10} />
            <Text style={s.label}>Due time (optional)</Text>
            <View style={s.chipRow}>
              <Chip s={s} label="No time" active={!time} onPress={() => { setTime(''); setRemOn(false); }} />
              {['09:00', '12:00', '18:00'].map((t) => <Chip key={t} s={s} label={fmtTime(t)} active={time === t} onPress={() => { setTime(t); if (!due) setDue(todayStr()); }} />)}
              {!time && <Chip s={s} label="Custom" onPress={() => { setTime('09:00'); if (!due) setDue(todayStr()); }} />}
            </View>
            {!!time && <TimeStepper value={time} onChange={setTime} s={s} c={c} />}
            <View style={[s.rowBetween, { marginTop: 16, marginBottom: 0 }]}>
              <Text style={s.cardTitle}>Remind me</Text>
              <Switch value={remOn && !!time} disabled={!time} onValueChange={setRemOn} trackColor={{ true: c.accent }} />
            </View>
            {!time && <Text style={s.meta}>Set a due time to turn on a reminder.</Text>}
            {remOn && !!time && (
              <View>
                <View style={[s.chipRow, { marginTop: 10 }]}>
                  {OFFSETS.map(([m, l]) => <Chip key={m} s={s} label={l} active={remOff === m} onPress={() => setRemOff(m)} />)}
                </View>
                <Text style={s.meta}>{(() => { const f = fireAt({ dueDate: due, dueTime: time, reminderEnabled: true, reminderMinutesBefore: remOff }); return f && !isNaN(f) ? `Notifies ${fmtDate(toStr(f))} at ${fmtTime(`${pad(f.getHours())}:${pad(f.getMinutes())}`)}` : ''; })()}</Text>
              </View>
            )}
            <Text style={s.label}>Priority</Text>
            <View style={s.chipRow}>
              {[1, 2, 3, 4].map((p) => <Chip key={p} s={s} label={`${PRI[p].label} ${PRI[p].name}`} active={pri === p} color={PRI[p].color} onPress={() => setPri(p)} />)}
            </View>
            <Text style={s.label}>Project</Text>
            <View style={s.chipRow}>
              <Chip s={s} label="None" active={!proj} onPress={() => setProj(null)} />
              {projects.map((p) => <Chip key={p.id} s={s} label={p.name} active={proj === p.id} color={p.color} onPress={() => setProj(p.id)} />)}
            </View>
            <Text style={s.label}>Labels (comma separated)</Text>
            <TextInput style={s.input} placeholder="errands, home" placeholderTextColor={c.sub} value={labels} onChangeText={setLabels} autoCapitalize="none" />
            {!!err && <Text style={{ color: c.danger, marginTop: 8 }}>{err}</Text>}
            {!!task && (
              <Pressable onPress={onDelete} style={s.dangerBtn} accessibilityRole="button">
                <Ionicons name="trash-outline" size={18} color={c.danger} />
                <Text style={{ color: c.danger, fontWeight: '600' }}>Delete task</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
