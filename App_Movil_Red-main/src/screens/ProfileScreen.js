import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import api from '../lib/api';

export default function ProfileScreen({ user }) {
  const [profile, setProfile] = useState(user || null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user && user.id_user) {
          const p = await api.getProfile(user.id_user);
          if (mounted) setProfile(p || user);
        }
      } catch (e) {
        console.warn('[Profile] error', e);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      {profile ? (
        <View>
          <Text style={{ fontWeight: '700' }}>{profile.nombre} {profile.apellido}</Text>
          <Text>{profile.correo || profile.email}</Text>
          <Text style={{ marginTop: 8 }}>Rol: {profile.rol || '—'}</Text>
        </View>
      ) : (
        <Text>No hay usuario cargado</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 12 }, title: { fontSize: 18, fontWeight: '700', marginBottom: 12 } });
