import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';

export function ProgressBar({ value, s, color }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color || s.accent }]} />
    </View>
  );
}
