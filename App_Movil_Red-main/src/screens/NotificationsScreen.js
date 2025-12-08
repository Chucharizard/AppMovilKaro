import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../lib/api';

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getNotifications();
        if (mounted) setNotifs(Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('[Notifs] error', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones</Text>
      <FlatList data={notifs} keyExtractor={i => String(i.id)} renderItem={({item}) => (
        <View style={styles.notifItem}><Text>{item.text || item.message || JSON.stringify(item)}</Text></View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 12 }, title: { fontSize: 18, fontWeight: '700', marginBottom: 8 }, notifItem: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' } });
