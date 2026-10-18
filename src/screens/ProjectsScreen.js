import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';
import { Empty } from '../components/Empty';
import { ProgressBar } from '../components/ProgressBar';

export default function ProjectsScreen({ s, c, projects, tasks, setProjModal, setOpenProject, setQuery, setFPri, setFProj }) {
  return (
        <ScrollView contentContainerStyle={s.listPad} keyboardShouldPersistTaps="handled">
          <View style={s.headRow}>
            <View style={{ flex: 1 }}><Text style={s.h1}>Projects</Text><Text style={s.sub}>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</Text></View>
            <Pressable onPress={() => setProjModal({ visible: true, project: null })} style={s.pillBtn} accessibilityRole="button">
              <Ionicons name="add" size={18} color={c.onAccent} /><Text style={{ color: c.onAccent, fontWeight: '600' }}>New</Text>
            </Pressable>
          </View>
          {projects.length === 0 && <Empty s={s} c={c} icon="folder-outline" title="No projects yet" text="Create a project to group related tasks and track their progress." />}
          {projects.map((p) => {
            const pt = tasks.filter((t) => t.projectId === p.id);
            const pd = pt.filter((t) => t.completed).length;
            return (
              <Pressable key={p.id} style={[s.card, { padding: 16, marginBottom: 10 }]} onPress={() => { setOpenProject(p.id); setQuery(''); setFPri(0); setFProj(null); }} accessibilityLabel={`Open project ${p.name}`}>
                <View style={s.rowBetween}>
                  <View style={s.metaRow}><View style={[s.dot, { backgroundColor: p.color, width: 12, height: 12, borderRadius: 6 }]} /><Text style={s.cardTitle}>{p.name}</Text></View>
                  <Text style={s.sub}>{pd}/{pt.length}</Text>
                </View>
                <ProgressBar s={s} value={pt.length ? pd / pt.length : 0} color={p.color} />
              </Pressable>
            );
          })}
        </ScrollView>
  );
}
