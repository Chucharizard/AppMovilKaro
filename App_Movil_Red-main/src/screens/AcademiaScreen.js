import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import GradesCard from '../components/Academic/GradesCard';
import ScheduleCard from '../components/Academic/ScheduleCard';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import { Button } from '../components/UI';
import theme from '../theme';

export default function AcademiaScreen({ user: userProp }) {
  const [tab, setTab] = useState('horario');
  const [schedule, setSchedule] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(userProp || null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userProp) {
          const auth = await loadAuth();
          if (auth && auth.user) {
            if (mounted) setUser(auth.user);
          }
        }
      } catch (e) {
        console.debug('[Academia] loadAuth failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !user.id_user) {
        console.log('[Academia] Esperando usuario... user:', user);
        return;
      }

      console.log('[Academia] Cargando datos para usuario:', user.id_user);
      setLoading(true);
      setError(null);
      try {
        console.log('[Academia] Llamando a getSchedule...');
        const s = await api.getSchedule(user.id_user).catch(err => {
          console.warn('[Academia] getSchedule error:', err);
          throw err;
        });
        console.log('[Academia] getSchedule response:', s);

        console.log('[Academia] Llamando a getGrades...');
        const g = await api.getGrades(user.id_user).catch(err => {
          console.warn('[Academia] getGrades error:', err);
          throw err;
        });
        console.log('[Academia] getGrades response:', g);

        // Normalizar respuestas: aceptar { data: [...] } o directamente array
        const normSchedule = Array.isArray(s) ? s : (s && Array.isArray(s.data) ? s.data : (s && s.schedule ? s.schedule : []));
        const normGrades = Array.isArray(g) ? g : (g && Array.isArray(g.data) ? g.data : (g && g.grades ? g.grades : []));

        console.log('[Academia] Horario normalizado:', normSchedule);
        console.log('[Academia] Notas normalizadas:', normGrades);

        if (mounted) {
          setSchedule(normSchedule);
          setGrades(normGrades);
        }
      } catch (e) {
        console.error('[Academia] Error cargando datos académicos:', e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const handleRetry = async () => {
    try {
      const auth = await loadAuth();
      if (auth && auth.user) {
        setUser(auth.user);
      } else {
        Alert.alert('Error', 'No se pudo cargar la información del usuario');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo reintentar la carga');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'horario' && styles.tabActive]}
            onPress={() => setTab('horario')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === 'horario' && styles.tabTextActive]}>
              📅 Horario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'notas' && styles.tabActive]}
            onPress={() => setTab('notas')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === 'notas' && styles.tabTextActive]}>
              📊 Notas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando datos académicos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error al cargar datos</Text>
            <Text style={styles.errorMessage}>
              No se pudieron cargar los datos académicos. Verifica tu conexión e intenta nuevamente.
            </Text>
            <Button variant="primary" onPress={handleRetry} style={styles.retryButton}>
              Reintentar
            </Button>
          </View>
        ) : !user || !user.id_user ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>👤</Text>
            <Text style={styles.errorTitle}>Usuario no identificado</Text>
            <Text style={styles.errorMessage}>
              No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.
            </Text>
          </View>
        ) : (
          <>
            {tab === 'horario' ? (
              <ScheduleCard schedule={schedule} />
            ) : (
              <GradesCard grades={grades} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.medium,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fonts.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    minWidth: 150,
  },
});
