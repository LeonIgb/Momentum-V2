import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch, Keyboard, Animated, Easing, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Splash({ ready, onDone }) {
  const intro = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const [minTime, setMinTime] = useState(false);

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const t = setTimeout(() => setMinTime(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Fade out only when the data has loaded AND the minimum display time has passed.
  useEffect(() => {
    if (ready && minTime) {
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => onDone());
    }
  }, [ready, minTime]);

  return (
    <Animated.View style={[splashStyles.wrap, { opacity: out }]}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{
        alignItems: 'center', opacity: intro,
        transform: [
          { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
        ],
      }}>
        <View style={splashStyles.logo}>
          <Ionicons name="checkmark-done" size={48} color="#5B50E6" />
        </View>
        <Text style={splashStyles.name}>Momentum</Text>
        <Text style={splashStyles.tag}>Small steps. Steady progress.</Text>
      </Animated.View>
      <ActivityIndicator color="rgba(255,255,255,0.8)" style={splashStyles.spinner} />
    </Animated.View>
  );
}

export const splashStyles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#5B50E6', alignItems: 'center', justifyContent: 'center', zIndex: 100, elevation: 100 },
  logo: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  name: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8 },
  tag: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  spinner: { position: 'absolute', bottom: 70 },
});
