import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ExpoMap from '../components/ExpoMap';

export default function ExpoMapScreen({ navigation }) {
  const [markers, setMarkers] = useState([
    { latitude: -19.0461, longitude: -65.2592, title: 'Sucre', description: 'Centro de Sucre' }
  ]);

  const [route, setRoute] = useState([
    { latitude: -19.0461, longitude: -65.2592 },
    { latitude: -19.0470, longitude: -65.2600 }
  ]);

  return (
    <View style={{ flex: 1 }}>
      <ExpoMap initialCenter={{ latitude: -19.0461, longitude: -65.2592 }} markers={markers} route={route} />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation && navigation.goBack ? navigation.goBack() : null}>
          <Text style={{ color: '#fff' }}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' },
  btn: { backgroundColor: '#0a84ff', padding: 10, borderRadius: 8 }
});
