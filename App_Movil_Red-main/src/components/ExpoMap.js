import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
let MapView, Marker, Polyline;

// Sucre, Bolivia coordinates (center used across map components)
const SUCRE_CENTER = { latitude: -19.0196, longitude: -65.2619 };

export default function ExpoMap({ initialCenter = SUCRE_CENTER, markers = [], route = [] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Try to dynamically require expo-maps. If it's not installed, we keep ready=false
    try {
      const maps = require('expo-maps');
      MapView = maps.MapView || maps.Map || maps.default || maps;
      Marker = maps.Marker || maps.MarkerView || (maps.default && maps.default.Marker) || null;
      Polyline = maps.Polyline || (maps.default && maps.default.Polyline) || null;
      setReady(true);
    } catch (e) {
      console.warn('[ExpoMap] expo-maps not available', e);
      setReady(false);
    }
  }, []);

  if (!ready) return (
    <View style={styles.loading}>
      <Text style={{ marginBottom: 8 }}>Mapa nativo no disponible.</Text>
      <Text>Instala `expo-maps` y reconstruye con un dev-client o EAS build.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="standard"
          initialCamera={{
            center: { latitude: initialCenter.latitude, longitude: initialCenter.longitude },
            // zoom 13 gives a good city-level view for routes in Sucre
            zoom: 13,
          pitch: 0,
          heading: 0,
        }}
        showsCompass={true}
        showsZoomControls={true}
      >
        {markers.map((m, i) => (
          <Marker key={i} coordinate={{ latitude: m.latitude, longitude: m.longitude }} title={m.title} description={m.description} />
        ))}

        {route && route.length > 0 ? (
          <Polyline points={route.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} width={4} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
