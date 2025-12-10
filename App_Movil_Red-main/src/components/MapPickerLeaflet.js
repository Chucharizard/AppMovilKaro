import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ORS_API_KEY } from '../config';

// Leaflet-based map using WebView - GUARANTEED to work without Google API or Play Services
let WebView;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  WebView = null;
}

export default function MapPickerLeaflet({ visible, onClose, onConfirm, initialRegion, inline = false, onChange = null }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const webRef = useRef(null);

  // Default to Sucre, Bolivia
  const centerLat = (initialRegion && initialRegion.latitude) || -19.0196;
  const centerLng = (initialRegion && initialRegion.longitude) || -65.2619;

  useEffect(() => {
    if (!inline && !visible) {
      setOrigin(null);
      setDestination(null);
      setRouteGeo(null);
      setSummary(null);
    }
  }, [visible, inline]);

  const buildRoute = async () => {
    if (!origin || !destination) {
      Alert.alert('Selecciona origen y destino');
      return { success: false };
    }
    try {
      const coords = [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]];
      const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: coords })
      });
      const body = await res.json();
      if (!res.ok) {
        console.warn('[MapPickerLeaflet] ORS error', body);
        Alert.alert('Error de ruta', (body && body.error) || 'No se pudo calcular la ruta');
        return { success: false };
      }
      const coordsLine = body?.features?.[0]?.geometry?.coordinates;
      const summaryObj = body?.features?.[0]?.properties?.summary;
      if (coordsLine) {
        const line = coordsLine.map(c => ({ latitude: c[1], longitude: c[0] }));
        setRouteGeo(line);
        setSummary(summaryObj || null);

        // Update map with route
        if (webRef.current) {
          webRef.current.postMessage(JSON.stringify({
            type: 'setRoute',
            route: line
          }));
        }

        return { success: true, routeGeo: line, summary: summaryObj || null };
      } else {
        Alert.alert('Ruta', 'No se encontró ruta entre puntos');
        return { success: false };
      }
    } catch (e) {
      console.warn('[MapPickerLeaflet] buildRoute failed', e);
      Alert.alert('Error', 'No se pudo obtener la ruta.');
      return { success: false };
    }
  };

  const handleConfirm = async () => {
    if (!origin || !destination) return Alert.alert('Selecciona origen y destino');
    let finalRouteGeo = routeGeo;
    let finalSummary = summary;
    if (!routeGeo || routeGeo.length === 0) {
      const result = await buildRoute();
      if (!result.success) return;
      finalRouteGeo = result.routeGeo;
      finalSummary = result.summary;
    }
    console.log('[MapPickerLeaflet] handleConfirm sending', { origin, destination, routeGeo: finalRouteGeo, summary: finalSummary });
    if (onConfirm) onConfirm({ origin, destination, routeGeo: finalRouteGeo, summary: finalSummary });
    if (!inline && onClose) onClose();
  };

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[MapPickerLeaflet] Message from map:', data);

      if (data.type === 'ready') {
        console.log('[MapPickerLeaflet] ✅ Leaflet map ready!');
        setMapReady(true);
      } else if (data.type === 'click') {
        const coord = { latitude: data.latitude, longitude: data.longitude };

        // Same logic: origin -> destination -> replace origin
        if (!origin) {
          setOrigin(coord);
          if (onChange) onChange({ origin: coord });
          // Update map marker
          if (webRef.current) {
            webRef.current.postMessage(JSON.stringify({
              type: 'setOrigin',
              latitude: coord.latitude,
              longitude: coord.longitude
            }));
          }
        } else if (!destination) {
          setDestination(coord);
          if (onChange) onChange({ destination: coord });
          // Update map marker
          if (webRef.current) {
            webRef.current.postMessage(JSON.stringify({
              type: 'setDestination',
              latitude: coord.latitude,
              longitude: coord.longitude
            }));
          }
        } else {
          // Reset
          setOrigin(coord);
          setDestination(null);
          setRouteGeo(null);
          setSummary(null);
          // Clear map and set new origin
          if (webRef.current) {
            webRef.current.postMessage(JSON.stringify({ type: 'clearAll' }));
            webRef.current.postMessage(JSON.stringify({
              type: 'setOrigin',
              latitude: coord.latitude,
              longitude: coord.longitude
            }));
          }
        }
      }
    } catch (e) {
      console.warn('[MapPickerLeaflet] Message parse error:', e);
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let map, originMarker, destinationMarker, routeLine;

    // Initialize map centered on Sucre, Bolivia
    map = L.map('map').setView([${centerLat}, ${centerLng}], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Green icon for origin
    const greenIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Red icon for destination
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Handle map clicks
    map.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'click',
        latitude: lat,
        longitude: lng
      }));
    });

    // Listen for messages from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'setOrigin') {
          if (originMarker) map.removeLayer(originMarker);
          originMarker = L.marker([data.latitude, data.longitude], { icon: greenIcon })
            .addTo(map)
            .bindPopup('Origen');
        } else if (data.type === 'setDestination') {
          if (destinationMarker) map.removeLayer(destinationMarker);
          destinationMarker = L.marker([data.latitude, data.longitude], { icon: redIcon })
            .addTo(map)
            .bindPopup('Destino');
        } else if (data.type === 'setRoute') {
          if (routeLine) map.removeLayer(routeLine);
          const latlngs = data.route.map(p => [p.latitude, p.longitude]);
          routeLine = L.polyline(latlngs, { color: '#0a84ff', weight: 4 }).addTo(map);
          // Fit map to show entire route
          const bounds = routeLine.getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        } else if (data.type === 'clearAll') {
          if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
          if (destinationMarker) { map.removeLayer(destinationMarker); destinationMarker = null; }
          if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    // Signal ready
    setTimeout(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }, 500);
  </script>
</body>
</html>
  `;

  if (!WebView) {
    return (
      <Modal visible={!inline && visible} animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>📦 react-native-webview no instalado</Text>
          <Text style={styles.errorText}>Instálalo con:</Text>
          <Text style={styles.code}>npm install react-native-webview</Text>
          <Text style={styles.errorText}>Luego recompila:</Text>
          <Text style={styles.code}>npx expo run:android</Text>
          {onClose && (
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    );
  }

  const content = (
    <View style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5' }}>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0a84ff" />
          <Text style={styles.loadingText}>🗺️ Cargando mapa Leaflet...</Text>
          <Text style={styles.loadingSubtext}>OpenStreetMap (sin necesidad de API)</Text>
        </View>
      )}

      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={handleMapMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      <View style={styles.instructionsOverlay}>
        <Text style={styles.instructionText}>
          {!origin ? '📍 Toca en el mapa para seleccionar ORIGEN' :
           !destination ? '🎯 Toca en el mapa para seleccionar DESTINO' :
           !routeGeo ? '🛣️ Toca "Trazar" para ver el camino' :
           '✅ Ruta lista - Toca "Confirmar"'}
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoText} numberOfLines={1}>
            {origin ? `✓ Origen: ${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : '○ Origen: —'}
          </Text>
          <Text style={styles.infoText} numberOfLines={1}>
            {destination ? `✓ Destino: ${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}` : '○ Destino: —'}
          </Text>
          {summary ? (
            <Text style={styles.infoText}>
              📏 {(summary.distance/1000).toFixed(1)} km • ⏱️ {(summary.duration/60).toFixed(0)} min
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsColumn}>
          {!inline && onClose ? (
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          ) : null}

          {origin && destination ? (
            <TouchableOpacity
              style={[styles.btn, !routeGeo ? styles.primaryBtn : {}]}
              onPress={buildRoute}
            >
              <Text style={[styles.btnText, !routeGeo ? { color: '#fff' } : {}]}>
                {routeGeo ? '🔄 Recalcular' : '🛣️ Trazar'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              setOrigin(null);
              setDestination(null);
              setRouteGeo(null);
              setSummary(null);
              if (webRef.current) {
                webRef.current.postMessage(JSON.stringify({ type: 'clearAll' }));
              }
            }}
          >
            <Text style={styles.btnText}>🔄 Reset</Text>
          </TouchableOpacity>

          {origin && destination && routeGeo && onConfirm ? (
            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleConfirm}>
              <Text style={[styles.btnText, { color: '#fff' }]}>✅ Confirmar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (inline) {
    return content;
  }

  return (
    <Modal visible={visible} animationType="slide">
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    fontSize: 12
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1000
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '600'
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  toolbar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#222',
    marginBottom: 2,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
    marginTop: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnText: {
    color: '#222',
    fontSize: 12,
    fontWeight: '600'
  },
  primaryBtn: {
    backgroundColor: '#0a84ff',
    borderColor: '#0a84ff'
  },
});
