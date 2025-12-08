import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import GradesCard from '../components/Academic/GradesCard';
import ScheduleCard from '../components/Academic/ScheduleCard';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import { Button } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { mockSchedule, mockGrades } from '../mock/mockData';

// Función para transformar horario del backend al formato de UI
function transformScheduleData(backendSchedule) {
  if (!Array.isArray(backendSchedule) || backendSchedule.length === 0) {
    return [];
  }

  // Agrupar por día de la semana
  const dayMap = {};
  backendSchedule.forEach(item => {
    const day = item.dia_semana || item.day || 'Sin día';
    if (!dayMap[day]) {
      dayMap[day] = [];
    }

    const timeStart = item.hora_inicio || item.time_start || '';
    const timeEnd = item.hora_fin || item.time_end || '';
    const time = timeStart && timeEnd
      ? `${timeStart.substring(0, 5)}-${timeEnd.substring(0, 5)}`
      : (item.time || 'Sin horario');

    dayMap[day].push({
      time: time,
      subject: item.materia?.nombre_materia
        || item.subject
        || item.nombre_materia
        || (item.id_grupo ? `Grupo ${item.id_grupo}` : 'Clase'),
      room: item.aula || item.room || item.salon || 'Sin aula',
      teacher: item.docente || item.teacher || item.profesor || null,
    });
  });

  // Convertir a array ordenado por día
  const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return dayOrder
    .filter(day => dayMap[day])
    .map(day => ({
      day,
      items: dayMap[day],
    }));
}

// Función para transformar notas del backend al formato de UI
function transformGradesData(backendGrades) {
  if (!Array.isArray(backendGrades) || backendGrades.length === 0) {
    return [];
  }

  return backendGrades.map(item => {
    // Obtener nombre de materia
    const subject = item.materia?.nombre_materia
      || item.subject
      || item.nombre_materia
      || 'Materia sin nombre';

    // Obtener nota y convertir de escala 0-100 a 0-5
    let grade = item.nota || item.grade || item.calificacion || 0;

    // Si la nota es mayor a 5, asumimos que está en escala 0-100 y la convertimos a 0-5
    if (typeof grade === 'number' && grade > 5) {
      grade = (grade / 100) * 5;
    }

    return {
      subject,
      grade: grade.toFixed(1),
    };
  });
}

export default function AcademiaScreen({ user: userProp }) {
  const { theme } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
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
  }), [theme]);
  
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
          console.warn('[Academia] Usando datos de ejemplo (mock)');
          return null;
        });
        console.log('[Academia] getSchedule response:', s);

        console.log('[Academia] Llamando a getGrades...');
        const g = await api.getGrades(user.id_user).catch(err => {
          console.warn('[Academia] getGrades error:', err);
          console.warn('[Academia] Usando datos de ejemplo (mock)');
          return null;
        });
        console.log('[Academia] getGrades response:', g);

        // Normalizar respuestas: aceptar { data: [...] } o directamente array
        const rawSchedule = s ? (Array.isArray(s) ? s : (s && Array.isArray(s.data) ? s.data : (s && s.schedule ? s.schedule : []))) : null;
        const rawGrades = g ? (Array.isArray(g) ? g : (g && Array.isArray(g.data) ? g.data : (g && g.grades ? g.grades : []))) : null;

        console.log('[Academia] Horario raw:', rawSchedule);
        console.log('[Academia] Notas raw:', rawGrades);

        // Transformar datos del backend al formato que esperan los componentes UI
        const normSchedule = rawSchedule && rawSchedule.length > 0
          ? transformScheduleData(rawSchedule)
          : mockSchedule;

        const normGrades = rawGrades && rawGrades.length > 0
          ? transformGradesData(rawGrades)
          : mockGrades;

        console.log('[Academia] Horario transformado:', normSchedule);
        console.log('[Academia] Notas transformadas:', normGrades);

        if (mounted) {
          setSchedule(normSchedule);
          setGrades(normGrades);
          // Si estamos usando datos mock, no mostrar error
          if (normSchedule === mockSchedule || normGrades === mockGrades) {
            setError(null);
          }
        }
      } catch (e) {
        console.error('[Academia] Error cargando datos académicos:', e);
        // Usar datos mock como fallback
        if (mounted) {
          setSchedule(mockSchedule);
          setGrades(mockGrades);
          setError(null);
        }
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
