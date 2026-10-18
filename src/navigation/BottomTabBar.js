import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';

// Five-tab bottom navigation. The active tab is held in state by MainScreen.
export default function BottomTabBar({ tab, setTab, s, c }) {
  return (
      <View style={s.tabBar}>
        {[['today', 'Today', 'today'], ['upcoming', 'Upcoming', 'calendar'], ['inbox', 'Inbox', 'file-tray'], ['projects', 'Projects', 'folder'], ['settings', 'Settings', 'settings']].map(([k, label, icon]) => {
          const on = tab === k;
          return (
            <Pressable key={k} style={s.tabItem} onPress={() => { setTab(k); Keyboard.dismiss(); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}>
              <Ionicons name={on ? icon : `${icon}-outline`} size={22} color={on ? c.accent : c.sub} />
              <Text style={[s.tabLabel, on && { color: c.accent, fontWeight: '700' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
  );
}
