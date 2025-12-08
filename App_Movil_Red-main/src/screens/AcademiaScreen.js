import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import GradesCard from '../components/Academic/GradesCard';
import ScheduleCard from '../components/Academic/ScheduleCard';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';

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
      if (!user || !user.id_user) return;
      setLoading(true);
      setError(null);
      try {
        const s = await api.getSchedule(user.id_user).catch(err => { throw err; });
        const g = await api.getGrades(user.id_user).catch(err => { throw err; });

        // Normalizar respuestas: aceptar { data: [...] } o directamente array
        const normSchedule = Array.isArray(s) ? s : (s && Array.isArray(s.data) ? s.data : (s && s.schedule ? s.schedule : []));
        const normGrades = Array.isArray(g) ? g : (g && Array.isArray(g.data) ? g.data : (g && g.grades ? g.grades : []));

        if (mounted) {
          setSchedule(normSchedule);
          setGrades(normGrades);
        }
      } catch (e) {
        console.warn('[Academia] api error', e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'horario' && styles.tabActive]} onPress={() => setTab('horario')}>
          <Text style={tab === 'horario' ? styles.tabTextActive : styles.tabText}>Horario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'notas' && styles.tabActive]} onPress={() => setTab('notas')}>
          <Text style={tab === 'notas' ? styles.tabTextActive : styles.tabText}>Notas</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: 12 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Cargando datos académicos...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 12 }}>
            <Text style={{ color: '#a00' }}>No se pudieron cargar los datos académicos.</Text>
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => {
              // reintentar: forzar recarga leyendo auth nuevamente
              (async () => {
                try {
                  const auth = await loadAuth();
                  if (auth && auth.user) setUser(auth.user);
                } catch (e) {
                  Alert.alert('Error', 'No se pudo reintentar la carga.');
                }
              })();
            }}>
              <Text style={{ color: '#0a84ff' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tab === 'horario' ? (
            <ScheduleCard schedule={schedule} />
          ) : (
            <GradesCard grades={grades} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 8, backgroundColor: '#fafafa' },
  tabBtn: { flex: 1, alignItems: 'center', padding: 10 },
  tabActive: { borderBottomWidth: 2, borderColor: '#0a84ff' },
  tabText: { color: '#444' },
  tabTextActive: { color: '#0a84ff', fontWeight: '600' },
});
