import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRI, PROJECT_COLORS, OFFSETS, VERSION } from '../constants';
import { pad, toStr, todayStr, addDays, validDate, fmtDate, fmtTime, fireAt, isOverdue } from '../utils/dates';

export function Confirm({ conf, onClose, s, c }) {
  return (
    <Modal visible={!!conf} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.backdrop, { justifyContent: 'center', padding: 28 }]}>
        <View style={[s.card, { padding: 20 }]}>
          <Text style={s.sheetTitle}>{conf && conf.title}</Text>
          <Text style={[s.emptyText, { textAlign: 'left', marginTop: 8 }]}>{conf && conf.message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 20 }}>
            <Pressable onPress={onClose} hitSlop={8}><Text style={s.link}>Cancel</Text></Pressable>
            <Pressable hitSlop={8} onPress={() => { const f = conf.onOk; onClose(); f(); }}>
              <Text style={{ color: c.danger, fontWeight: '700', fontSize: 16 }}>{conf && conf.okLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
