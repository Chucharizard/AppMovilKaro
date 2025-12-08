import React, { useState } from 'react';
import { View, Text, Switch, Button, StyleSheet } from 'react-native';

export default function SettingsScreen({ onLogout }) {
  const [dark, setDark] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <View style={styles.row}>
        <Text>Modo oscuro</Text>
        <Switch value={dark} onValueChange={setDark} />
      </View>
      <View style={{ height: 12 }} />
      <Button title="Cerrar sesión" color="#b00" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 12 }, title: { fontSize: 18, fontWeight: '700', marginBottom: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 } });
