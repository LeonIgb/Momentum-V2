import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';

export function ProjectModal({ visible, project, onSave, onClose, s, c }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (visible) { setName(project ? project.name : ''); setColor(project ? project.color : PROJECT_COLORS[0]); setErr(''); }
  }, [visible, project]);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Pressable onPress={onClose} hitSlop={10}><Text style={s.link}>Cancel</Text></Pressable>
            <Text style={s.sheetTitle}>{project ? 'Rename project' : 'New project'}</Text>
            <Pressable hitSlop={10} onPress={() => {
              if (!name.trim()) { setErr('Give your project a name.'); return; }
              Keyboard.dismiss(); onSave(name.trim(), color);
            }}><Text style={[s.link, { fontWeight: '700' }]}>Save</Text></Pressable>
          </View>
          <TextInput style={s.inputBig} placeholder="Project name" placeholderTextColor={c.sub} value={name} onChangeText={setName} autoFocus />
          <Text style={s.label}>Color</Text>
          <View style={s.chipRow}>
            {PROJECT_COLORS.map((col) => (
              <Pressable key={col} onPress={() => setColor(col)} accessibilityLabel={`Color ${col}`}
                style={[s.swatch, { backgroundColor: col }, color === col && { borderWidth: 3, borderColor: c.text }]} />
            ))}
          </View>
          {!!err && <Text style={{ color: c.danger, marginTop: 8 }}>{err}</Text>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
