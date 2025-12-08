import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScheduleCard({ schedule } = {}) {
  // schedule expected as array of { day, items: [{ time, subject }] }
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Horario</Text>
        <Text>No hay horario disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horario</Text>
      {schedule.map((d, idx) => (
        <View key={idx} style={styles.dayBlock}>
          <Text style={styles.dayTitle}>{d.day}</Text>
          {Array.isArray(d.items) && d.items.map((it, i) => (
            <Text key={i} style={styles.item}>{it.time} — {it.subject}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  dayBlock: { marginBottom: 8 },
  dayTitle: { fontWeight: '700' },
  item: { paddingLeft: 6, color: '#333' },
});
