import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GradesCard({ grades } = {}) {
  // grades expected as array of { subject, grade }
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Notas</Text>
        <Text>No hay notas disponibles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notas</Text>
      {grades.map((g, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.subject}>{g.subject}</Text>
          <Text style={styles.grade}>{String(g.grade)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  subject: { fontWeight: '600' },
  grade: { color: '#333' },
});
