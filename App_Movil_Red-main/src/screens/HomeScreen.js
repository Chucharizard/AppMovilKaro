import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ user, onLogout }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Bienvenido</Text>
      <Text style={{ marginBottom: 20 }}>{user && user.nombre ? `${user.nombre} ${user.apellido}` : JSON.stringify(user)}</Text>
      <Button title="Cerrar sesión" onPress={onLogout} />
    </View>
  );
}
