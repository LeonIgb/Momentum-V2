import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainScreen from './screens/MainScreen';
import { Splash } from './components/Splash';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  return (
    <SafeAreaProvider>
      <MainScreen onLoaded={() => setReady(true)} />
      {showSplash && <Splash ready={ready} onDone={() => setShowSplash(false)} />}
    </SafeAreaProvider>
  );
}
