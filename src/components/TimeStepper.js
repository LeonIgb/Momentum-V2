import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';
import { Chip } from './Chip';

export function TimeStepper({ value, onChange, s, c }) {
  const [h, m] = value.split(':').map(Number);
  const set = (hh, mm) => onChange(`${pad((hh + 24) % 24)}:${pad((mm + 60) % 60)}`);
  const Btn = ({ icon, label, onPress, onLong }) => (
    <Pressable onPress={onPress} onLongPress={onLong} hitSlop={6} accessibilityLabel={label} style={s.stepBtn}>
      <Ionicons name={icon} size={20} color={c.accent} />
    </Pressable>
  );
  return (
    <View style={[s.row, { justifyContent: 'center', marginTop: 8, paddingHorizontal: 0, gap: 6 }]}>
      <Btn icon="remove" label="Earlier hour" onPress={() => set(h - 1, m)} />
      <Text style={s.timeNum}>{pad(h % 12 || 12)}</Text>
      <Btn icon="add" label="Later hour" onPress={() => set(h + 1, m)} />
      <Text style={s.timeNum}>:</Text>
      <Btn icon="remove" label="Earlier minute" onPress={() => set(h, m - 1)} onLong={() => set(h, m - 10)} />
      <Text style={s.timeNum}>{pad(m)}</Text>
      <Btn icon="add" label="Later minute" onPress={() => set(h, m + 1)} onLong={() => set(h, m + 10)} />
      <Chip s={s} label={h >= 12 ? 'PM' : 'AM'} active onPress={() => set(h + 12, m)} />
    </View>
  );
}
