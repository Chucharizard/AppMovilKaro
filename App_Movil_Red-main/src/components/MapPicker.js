import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { ORS_API_KEY, GOOGLE_MAPS_API_KEY } from '../config';
import MapWebFallback from './MapWebFallback';

// MapPicker: modal map to choose origin and destination and draw route via ORS
export default function MapPicker({ visible, onClose, onConfirm, initialRegion, inline = false, onChange = null }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitTried, setMapInitTried] = useState(false);
  const [useOsm, setUseOsm] = useState(false);
  const [lastTouch, setLastTouch] = useState(null);
  const mapRef = useRef(null);
  // Default to Sucre, Bolivia so the map is focused on the desired city by default
  const DEFAULT_SUCRE_REGION = initialRegion || { latitude: -19.0196, longitude: -65.2619, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const [region, setRegion] = useState(DEFAULT_SUCRE_REGION);
  const [showWeb, setShowWeb] = useState(false);

  useEffect(() => {
    // If native map doesn't become ready within a short timeout, show web fallback.
    let to = null;
    if (!mapReady && !mapInitTried) {
      to = setTimeout(() => {
        console.warn('[MapPicker] native map not ready after timeout, opening web fallback');
        setShowWeb(true);
        setMapInitTried(true);
      }, 4000);
    }
    return () => { if (to) clearTimeout(to); };
  }, [mapReady, mapInitTried]);

  useEffect(() => {
    // when modal closed or when component unmounts/reset, clear selection
    if (!inline) {
      if (!visible) {
        setOrigin(null); setDestination(null); setRouteGeo(null); setSummary(null);
      }
    }
 }, [visible, inline]);

  const handleLongPress = (e) => {
    try {
      const raw = e && e.nativeEvent && e.nativeEvent.coordinate;
      if (!raw) {
        console.warn('[MapPicker] longPress missing coordinate', e);
        return;
      }
      const coord = { latitude: Number(raw.latitude), longitude: Number(raw.longitude) };
      // ignore near-(0,0) accidental coords
      if (Math.abs(coord.latitude) < 0.0001 && Math.abs(coord.longitude) < 0.0001) {
        console.warn('[MapPicker] ignored near-zero coordinate (likely map default)', coord);
        return;
      }
      if (Number.isNaN(coord.latitude) || Number.isNaN(coord.longitude)) {
        console.warn('[MapPicker] invalid coordinate values', raw);
        return;
      }
      // If origin empty, set origin; else if destination empty set destination; else replace origin
      if (!origin) {
        setOrigin(coord);
        if (onChange) onChange({ origin: coord });
      } else if (!destination) {
        setDestination(coord);
        if (onChange) onChange({ destination: coord });
      }
      else {
        setOrigin(coord); setDestination(null); setRouteGeo(null); setSummary(null);
      }
    } catch (err) {
      console.warn('[MapPicker] handleLongPress error', err);
    }
  };

  const handlePress = (e) => {
    try {
      const raw = e && e.nativeEvent && e.nativeEvent.coordinate;
      console.log('[MapPicker] onPress raw', raw);
      setLastTouch(raw);
      if (!raw) {
        console.warn('[MapPicker] press missing coordinate', e);
        return;
      }
      const coord = { latitude: Number(raw.latitude), longitude: Number(raw.longitude) };
      // ignore near-(0,0) accidental coords
      if (Math.abs(coord.latitude) < 0.0001 && Math.abs(coord.longitude) < 0.0001) {
        console.warn('[MapPicker] ignored near-zero coordinate on press', coord);
        Alert.alert('Coordenada inválida', 'El punto seleccionado parece estar en (0,0). Intenta tocar otra zona del mapa.');
        return;
      }
      if (Number.isNaN(coord.latitude) || Number.isNaN(coord.longitude)) {
        console.warn('[MapPicker] invalid coordinate values', raw);
        return;
      }
      // Use the same logic as long press: origin -> destination -> replace origin
      if (!origin) {
        setOrigin(coord);
        if (onChange) onChange({ origin: coord });
      } else if (!destination) {
        setDestination(coord);
        if (onChange) onChange({ destination: coord });
      }
      else {
        setOrigin(coord); setDestination(null); setRouteGeo(null); setSummary(null);
      }
    } catch (err) {
      console.warn('[MapPicker] handlePress error', err);
    }
  };

  // Disabled auto-build - now user must manually click "Trazar ruta"
  // This gives better control and clearer workflow: pick origin → pick destination → trace route
  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     if (origin && destination && (!routeGeo || routeGeo.length === 0)) {
  //       try {
  //         const result = await buildRoute();
  //         if (result.success && onChange) {
  //           try {
  //             if (!cancelled) onChange({ origin, destination, routeGeo: result.routeGeo || null, summary: result.summary || null });
  //           } catch (ex) { console.warn('[MapPicker] auto onChange failed', ex); }
  //         }
  //       } catch (e) {
  //         if (!cancelled) console.warn('[MapPicker] auto buildRoute failed', e);
  //       }
  //     }
  //   })();
  //   return () => { cancelled = true; };
  // }, [origin, destination]);

  const buildRoute = async () => {
    if (!origin || !destination) {
      Alert.alert('Selecciona origen y destino');
      return { success: false };
    }
    try {
      const coords = [ [origin.longitude, origin.latitude], [destination.longitude, destination.latitude] ];
      const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: coords }) });
      const body = await res.json();
      if (!res.ok) {
        console.warn('[MapPicker] ORS error', body);
        Alert.alert('ORS error', (body && body.error) || JSON.stringify(body));
        return { success: false };
      }
      // GeoJSON coordinates are [lon, lat]
      const coordsLine = body && body.features && body.features[0] && body.features[0].geometry && body.features[0].geometry.coordinates;
      const summaryObj = body && body.features && body.features[0] && body.features[0].properties && body.features[0].properties.summary;
      if (coordsLine) {
        const line = coordsLine.map(c => ({ latitude: c[1], longitude: c[0] }));
        setRouteGeo(line);
        setSummary(summaryObj || null);
        return { success: true, routeGeo: line, summary: summaryObj || null };
      } else {
        Alert.alert('Ruta', 'No se encontró ruta entre puntos');
        return { success: false };
      }
    } catch (e) {
      console.warn('[MapPicker] buildRoute failed', e);
      Alert.alert('Error', 'No se pudo obtener la ruta.');
      return { success: false };
    }
  };

  const handleConfirm = async () => {
    if (!origin || !destination) return Alert.alert('Selecciona origen y destino');
    // If routeGeo not computed yet, compute it first
    let finalRouteGeo = routeGeo;
    let finalSummary = summary;
    if (!routeGeo || routeGeo.length === 0) {
      const result = await buildRoute();
      if (!result.success) return; // buildRoute already alerted
      finalRouteGeo = result.routeGeo;
      finalSummary = result.summary;
    }
    console.log('[MapPicker] handleConfirm sending', { origin, destination, routeGeo: finalRouteGeo, summary: finalSummary });
    if (onConfirm) onConfirm({ origin, destination, routeGeo: finalRouteGeo, summary: finalSummary });
    if (!inline && onClose) onClose();
  };

  // WebView-based Google Maps (fallback for devices without Google Play Services)
  const centerLat = (initialRegion || region).latitude || -19.0196;
  const centerLng = (initialRegion || region).longitude || -65.2619;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}"></script>
  <script>
    let map, originMarker, destinationMarker, routeLine;
    const origin = ${origin ? `{lat: ${origin.latitude}, lng: ${origin.longitude}}` : 'null'};
    const destination = ${destination ? `{lat: ${destination.latitude}, lng: ${destination.longitude}}` : 'null'};

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${centerLat}, lng: ${centerLng} },
        zoom: 13,
        mapTypeId: 'roadmap'
      });

      if (origin) {
        originMarker = new google.maps.Marker({
          position: origin,
          map: map,
          title: 'Origen',
          icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });
      }

      if (destination) {
        destinationMarker = new google.maps.Marker({
          position: destination,
          map: map,
          title: 'Destino',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
      }

      ${routeGeo && Array.isArray(routeGeo) && routeGeo.length > 0 ? `
        const routePath = ${JSON.stringify(routeGeo.map(c => ({ lat: c.latitude, lng: c.longitude })))};
        routeLine = new google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#0a84ff',
          strokeOpacity: 1.0,
          strokeWeight: 4
        });
        routeLine.setMap(map);
      ` : ''}

      map.addListener('click', function(e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapClick',
          latitude: lat,
          longitude: lng
        }));
      });

      // Signal that map is ready
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    initMap();
  </script>
</body>
</html>
  `;

  const content = (
    <View style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5' }}>
      {!mapReady && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', zIndex: 1000 }}>
          <ActivityIndicator size="large" color="#0a84ff" />
          <Text style={{ fontSize: 16, color: '#666', marginTop: 16 }}>🗺️ Cargando mapa...</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Google Maps JavaScript API</Text>
        </View>
      )}
      <WebView
        ref={mapRef}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('[MapPicker WebView] Message:', data);

            if (data.type === 'mapReady') {
              console.log('[MapPicker] ✅ WebView map ready!');
              setMapReady(true);
              setShowWeb(false);
            } else if (data.type === 'mapClick') {
              handlePress({ nativeEvent: { coordinate: { latitude: data.latitude, longitude: data.longitude } } });
            }
          } catch (e) {
            console.warn('[MapPicker WebView] Message parse error:', e);
          }
        }}
        onError={(e) => {
          console.error('[MapPicker WebView] Error:', e);
          Alert.alert('Error del mapa', 'No se pudo cargar Google Maps. Verifica tu conexión a internet.');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

        {/* Instructions overlay */}
        <View style={styles.instructionsOverlay}>
          <Text style={styles.instructionText}>
            {!origin ? '📍 Toca en el mapa para seleccionar ORIGEN' :
             !destination ? '🎯 Toca en el mapa para seleccionar DESTINO' :
             !routeGeo ? '🛣️ Toca "Trazar ruta" para ver el camino' :
             '✅ Ruta lista - Toca "Confirmar"'}
          </Text>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText} numberOfLines={1}>
              {origin ? `✓ Origen: ${Number(origin.latitude).toFixed(4)}, ${Number(origin.longitude).toFixed(4)}` : '○ Origen: —'}
            </Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {destination ? `✓ Destino: ${Number(destination.latitude).toFixed(4)}, ${Number(destination.longitude).toFixed(4)}` : '○ Destino: —'}
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
              }}
            >
              <Text style={styles.btnText}>🔄 Reset</Text>
            </TouchableOpacity>
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
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnText: { color: '#222', fontSize: 12, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#0a84ff', borderColor: '#0a84ff' },

  debugOverlay: { position: 'absolute', top: 12, right: 12, alignItems: 'flex-end' },
  debugBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxWidth: 220,
  },
  quickActions: { marginTop: 8, alignItems: 'flex-end' },
  smallBtn: { backgroundColor: '#0a84ff', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  smallBtnText: { color: '#fff', fontSize: 12 },
  fab: { marginTop: 8, backgroundColor: '#0a84ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
});
