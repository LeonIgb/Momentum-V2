import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';
import { Chip } from '../components/Chip';

export default function SettingsScreen({ s, c, themePref, setThemePref, settings, setSettings, perm, askPerm, permText, testNotif, setNotice, setConf, setTasks, setProjects, setOpenProject, tasks, projects }) {
  return (
        <ScrollView contentContainerStyle={s.listPad}>
          <Text style={[s.h1, { marginTop: 12 }]}>Settings</Text>
          <Text style={s.sectionTitle}>Appearance</Text>
          <View style={s.chipRow}>
            {['system', 'light', 'dark'].map((m) => <Chip key={m} s={s} label={m[0].toUpperCase() + m.slice(1)} active={themePref === m} onPress={() => setThemePref(m)} />)}
          </View>
          <Text style={s.sectionTitle}>Reminders</Text>
          <View style={[s.card, { padding: 16 }]}>
            <View style={s.rowBetween}>
              <Text style={s.cardTitle}>Enable reminders</Text>
              <Switch value={settings.remindersOn} trackColor={{ true: c.accent }} onValueChange={(v) => { setSettings((p) => ({ ...p, remindersOn: v })); if (v && perm !== 'granted') askPerm(); }} />
            </View>
            <View style={s.rowBetween}>
              <Text style={s.cardTitle}>Play sound</Text>
              <Switch value={settings.soundOn} trackColor={{ true: c.accent }} onValueChange={(v) => setSettings((p) => ({ ...p, soundOn: v }))} />
            </View>
            <Text style={[s.emptyText, { textAlign: 'left', marginTop: 0 }]}>Uses your device's default notification sound, or silent when off.</Text>
            <Text style={s.label}>Default reminder for new tasks</Text>
            <View style={s.chipRow}>
              {OFFSETS.map(([m, l]) => <Chip key={m} s={s} label={l} active={settings.defaultOffset === m} onPress={() => setSettings((p) => ({ ...p, defaultOffset: m }))} />)}
            </View>
            <Text style={s.label}>Notification permission</Text>
            <Text style={[s.emptyText, { textAlign: 'left', marginTop: 0 }]}>{permText}</Text>
            <View style={[s.chipRow, { marginTop: 12 }]}>
              {perm !== 'granted' && perm !== 'unsupported' && <Chip s={s} label="Allow notifications" onPress={askPerm} />}
              <Chip s={s} label="Open device settings" onPress={() => Linking.openSettings().catch(() => setNotice('Could not open device settings.'))} />
              <Chip s={s} label="Send test notification" active onPress={testNotif} />
            </View>
            <Text style={[s.emptyText, { textAlign: 'left', marginTop: 12 }]}>Limits: custom ringtones and music files cannot be used as notification sounds in Expo Go; they need a development build with bundled sound files. Reminders are local to this device, so they cannot fire if the OS blocks notifications or you force-stop the app on some Android phones. In-app audio preview is not included in this version.</Text>
          </View>
          <Text style={s.sectionTitle}>Where your data lives</Text>
          <View style={[s.card, { padding: 16 }]}>
            <Text style={s.emptyText}>Tasks, projects and settings are saved only on this device using local storage. Nothing is synced to the cloud, so uninstalling the app or clearing its data removes them.</Text>
          </View>
          <Text style={s.sectionTitle}>Data</Text>
          <Pressable style={[s.dangerBtn, { marginTop: 10 }]} onPress={() => setConf({ title: 'Clear all data?', message: 'All tasks and projects will be permanently deleted from this device.', okLabel: 'Clear all', onOk: () => { setTasks([]); setProjects([]); setOpenProject(null); } })}>
            <Ionicons name="trash-outline" size={18} color={c.danger} /><Text style={{ color: c.danger, fontWeight: '600' }}>Clear all data</Text>
          </Pressable>
          <Text style={s.sectionTitle}>About</Text>
          <View style={[s.card, { padding: 16 }]}>
            <Text style={s.cardTitle}>Momentum {VERSION}</Text>
            <Text style={[s.emptyText, { textAlign: 'left', marginTop: 4 }]}>{tasks.length} tasks, {projects.length} projects stored locally.</Text>
          </View>
        </ScrollView>
  );
}
