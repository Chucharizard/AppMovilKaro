import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ORS_API_KEY, DEFAULT_MAP_PROVIDER } from '../config';
import MapWebFallback from './MapWebFallback';

// MapPicker: modal map to choose origin and destination and draw route via ORS
export default function MapPicker({ visible, onClose, onConfirm, initialRegion }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [useOsm, setUseOsm] = useState(false);
  const [lastTouch, setLastTouch] = useState(null);
  const mapRef = useRef(null);
  const [region, setRegion] = useState(initialRegion || { latitude: 0, longitude: 0, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  const [showWeb, setShowWeb] = useState(false);

  useEffect(() => {
    if (!visible) {
      setOrigin(null); setDestination(null); setRouteGeo(null); setSummary(null);
    }
  }, [visible]);

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
      if (!origin) setOrigin(coord);
      else if (!destination) setDestination(coord);
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
      if (!origin) setOrigin(coord);
      else if (!destination) setDestination(coord);
      else {
        setOrigin(coord); setDestination(null); setRouteGeo(null); setSummary(null);
      }
    } catch (err) {
      console.warn('[MapPicker] handlePress error', err);
    }
  };

  const buildRoute = async () => {
    if (!origin || !destination) return Alert.alert('Selecciona origen y destino');
    try {
      const coords = [ [origin.longitude, origin.latitude], [destination.longitude, destination.latitude] ];
      const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: coords }) });
      const body = await res.json();
      if (!res.ok) {
        console.warn('[MapPicker] ORS error', body);
        return Alert.alert('ORS error', (body && body.error) || JSON.stringify(body));
      }
      // GeoJSON coordinates are [lon, lat]
      const coordsLine = body && body.features && body.features[0] && body.features[0].geometry && body.features[0].geometry.coordinates;
      const summaryObj = body && body.features && body.features[0] && body.features[0].properties && body.features[0].properties.summary;
      if (coordsLine) {
        const line = coordsLine.map(c => ({ latitude: c[1], longitude: c[0] }));
        setRouteGeo(line);
        setSummary(summaryObj || null);
      } else {
        Alert.alert('Ruta', 'No se encontró ruta entre puntos');
      }
    } catch (e) {
      console.warn('[MapPicker] buildRoute failed', e);
      Alert.alert('Error', 'No se pudo obtener la ruta.');
    }
  };

  const handleConfirm = () => {
    if (!origin || !destination) return Alert.alert('Selecciona origen y destino');
    onConfirm({ origin, destination, routeGeo, summary });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <MapView
          provider={MapView.PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          ref={mapRef}
          initialRegion={initialRegion || region}
          onRegionChangeComplete={(r) => { setRegion(r); }}
          onLongPress={handleLongPress}
          onPress={handlePress}
          onMapReady={() => { console.log('[MapPicker] onMapReady', { provider: MapView.PROVIDER_GOOGLE, initialRegion: initialRegion || region }); setMapReady(true); }}
          onMapLoaded={() => { console.log('[MapPicker] onMapLoaded'); setMapReady(true); }}
        >
          {/* Using Google Maps tiles only (no OSM fallback) */}
          {origin ? <Marker coordinate={origin} pinColor="green" /> : null}
          {destination ? <Marker coordinate={destination} pinColor="red" /> : null}
          {routeGeo ? <Polyline coordinates={routeGeo} strokeColor="#0a84ff" strokeWidth={4} /> : null}
        </MapView>

        {/* Diagnostic overlay: shows last touch and current region center */}
        <View style={styles.debugOverlay} pointerEvents="box-none">
          <View style={styles.debugBox}>
            <Text style={{ fontSize: 12 }}>Último toque:</Text>
            <Text style={{ fontSize: 12 }}>{lastTouch ? `${Number(lastTouch.latitude).toFixed(6)}, ${Number(lastTouch.longitude).toFixed(6)}` : '—'}</Text>
            <Text style={{ marginTop: 6, fontSize: 12 }}>Centro mapa:</Text>
            <Text style={{ fontSize: 12 }}>{region ? `${Number(region.latitude).toFixed(6)}, ${Number(region.longitude).toFixed(6)}` : '—'}</Text>
          </View>

          <TouchableOpacity style={styles.fab} onPress={async () => {
            try {
              // Use region center as fallback placement
              const center = region || initialRegion || { latitude: 0, longitude: 0 };
              if (Math.abs(center.latitude) < 0.0001 && Math.abs(center.longitude) < 0.0001) {
                console.warn('[MapPicker] FAB center is near-zero, ignoring');
                Alert.alert('Centro inválido', 'El centro del mapa está en (0,0). Espera que el mapa se inicialice o toca directamente para seleccionar un punto.');
                return;
              }
              console.log('[MapPicker] FAB marcar centro', center);
              const coord = { latitude: Number(center.latitude), longitude: Number(center.longitude) };
              if (!origin) setOrigin(coord);
              else if (!destination) setDestination(coord);
              else { setOrigin(coord); setDestination(null); setRouteGeo(null); setSummary(null); }
            } catch (e) { console.warn('[MapPicker] FAB error', e); }
          }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Marcar centro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, { marginTop: 8, backgroundColor: '#444' }]} onPress={() => setShowWeb(true)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Abrir mapa Web</Text>
          </TouchableOpacity>
        </View>
        {!mapReady ? (
          <View style={{ position: 'absolute', top: 12, left: 12, padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6 }}>
            <Text style={{ color: '#b00' }}>Mapa no listo (diagnóstico)</Text>
            <Text style={{ fontSize: 11, color: '#333' }}>Si esto aparece, revisa API Key / restricciones / billing</Text>
          </View>
        ) : (
          <View style={{ position: 'absolute', top: 12, left: 12, padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6 }}>
            <Text style={{ color: '#080' }}>Mapa listo</Text>
          </View>
        )}

        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>
            <Text>Origen: {origin ? `${(Number(origin.latitude)).toFixed ? Number(origin.latitude).toFixed(5) : String(origin.latitude)}, ${(Number(origin.longitude)).toFixed ? Number(origin.longitude).toFixed(5) : String(origin.longitude)}` : '—'}</Text>
            <Text>Destino: {destination ? `${(Number(destination.latitude)).toFixed ? Number(destination.latitude).toFixed(5) : String(destination.latitude)}, ${(Number(destination.longitude)).toFixed ? Number(destination.longitude).toFixed(5) : String(destination.longitude)}` : '—'}</Text>
            {summary ? <Text>Dist: {typeof summary.distance === 'number' ? (summary.distance/1000).toFixed(2) : String(summary.distance)} km • Dur: {typeof summary.duration === 'number' ? (summary.duration/60).toFixed(0) : String(summary.duration)} min</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.btn} onPress={onClose}><Text style={styles.btnText}>Cerrar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={buildRoute}><Text style={styles.btnText}>Trazar ruta</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#0a84ff' }]} onPress={handleConfirm}><Text style={[styles.btnText, { color: '#fff' }]}>Confirmar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { marginLeft: 8, backgroundColor: '#666' }]} onPress={() => setShowWeb(true)}><Text style={[styles.btnText, { color: '#fff' }]}>Mapa Web</Text></TouchableOpacity>
            {/* OSM toggle removed - using Google only as requested */}
          </View>
        </View>
        <MapWebFallback visible={showWeb} onClose={() => setShowWeb(false)} initialCenter={region} onSelect={(c) => {
          // use fallback selection same logic as press
          if (!origin) setOrigin(c);
          else if (!destination) setDestination(c);
          else { setOrigin(c); setDestination(null); setRouteGeo(null); setSummary(null); }
        }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  btn: { padding: 8, marginLeft: 8, backgroundColor: '#eee', borderRadius: 6 },
  btnText: { color: '#222' },
  debugOverlay: { position: 'absolute', top: 12, right: 12, alignItems: 'flex-end' },
  debugBox: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 6, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  fab: { marginTop: 8, backgroundColor: '#0a84ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
});
