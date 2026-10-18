import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';

export function TaskRow({ task, project, onToggle, onPress, s, c }) {
  const overdue = isOverdue(task);
  const pc = PRI[task.priority].color;
  return (
    <Pressable onPress={onPress} accessibilityLabel={`Edit task ${task.title}`} style={[s.card, s.row, task.completed && { opacity: 0.55 }]}>
      <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.completed ? 'Mark as active' : 'Mark as done'}
        style={[s.check, { borderColor: pc }, task.completed && { backgroundColor: pc }]}>
        {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[s.taskTitle, task.completed && { textDecorationLine: 'line-through', color: c.sub }]} numberOfLines={2}>{task.title}</Text>
        <View style={s.metaRow}>
          {!!task.dueDate && (
            <View style={s.metaRow}>
              <Text style={[s.meta, overdue && { color: c.danger, fontWeight: '600' }]}>{fmtDate(task.dueDate)}{task.dueTime ? ` · ${fmtTime(task.dueTime)}` : ''}</Text>
              {task.reminderEnabled && !task.completed && <Ionicons name="notifications" size={12} color={c.sub} />}
            </View>
          )}
          {!!project && (
            <View style={s.metaRow}>
              <View style={[s.dot, { backgroundColor: project.color }]} />
              <Text style={s.meta}>{project.name}</Text>
            </View>
          )}
          {task.labels.map((l) => <Text key={l} style={s.meta}>#{l}</Text>)}
        </View>
      </View>
      <Text style={[s.priTag, { color: pc }]}>{PRI[task.priority].label}</Text>
    </Pressable>
  );
}
