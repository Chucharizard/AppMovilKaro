import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { loadAuth, clearAuth } from './src/lib/auth';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await loadAuth();
        if (mounted && auth && auth.user) setUser(auth.user);
      } catch (e) {
        console.warn('[App] error cargando auth', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return null;

  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar />
        {!user ? (
          <LoginScreen onLogin={(u) => setUser(u)} />
        ) : (
          <DashboardScreen user={user} onLogout={async () => { await clearAuth(); setUser(null); }} />
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
}
