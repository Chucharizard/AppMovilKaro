import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ORS_API_KEY, DEFAULT_MAP_PROVIDER } from '../config';
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

  // when both origin and destination are set, automatically build route (inline UX)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (origin && destination && (!routeGeo || routeGeo.length === 0)) {
        try {
          const ok = await buildRoute();
          if (ok && onConfirm) {
            // avoid double-confirming the same pair
            try {
              if (!cancelled) onConfirm({ origin, destination, routeGeo: routeGeo || null, summary });
            } catch (ex) { console.warn('[MapPicker] auto onConfirm failed', ex); }
          }
        } catch (e) {
          if (!cancelled) console.warn('[MapPicker] auto buildRoute failed', e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [origin, destination]);

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
        return true;
      } else {
        Alert.alert('Ruta', 'No se encontró ruta entre puntos');
        return false;
      }
    } catch (e) {
      console.warn('[MapPicker] buildRoute failed', e);
      Alert.alert('Error', 'No se pudo obtener la ruta.');
      return false;
    }
  };

  const handleConfirm = async () => {
    if (!origin || !destination) return Alert.alert('Selecciona origen y destino');
    // If routeGeo not computed yet, compute it first
    if (!routeGeo || routeGeo.length === 0) {
      const ok = await buildRoute();
      if (!ok) return; // buildRoute already alerted
    }
    console.log('[MapPicker] handleConfirm sending', { origin, destination, routeGeo, summary });
    if (onConfirm) onConfirm({ origin, destination, routeGeo, summary });
    if (!inline && onClose) onClose();
  };

  const content = (
    <View style={{ flex: 1, position: 'relative' }}>
      <MapView
          // Use configured provider when available; otherwise let react-native-maps pick default
          {...(DEFAULT_MAP_PROVIDER === 'google' ? { provider: MapView.PROVIDER_GOOGLE } : {})}
          style={{ flex: 1 }}
          ref={mapRef}
          initialRegion={initialRegion || region}
          onRegionChangeComplete={(r) => { setRegion(r); }}
          onLongPress={handleLongPress}
          onPress={handlePress}
          onMapReady={() => { console.log('[MapPicker] onMapReady', { provider: DEFAULT_MAP_PROVIDER, initialRegion: initialRegion || region }); setMapReady(true); setShowWeb(false); }}
          onMapLoaded={() => { console.log('[MapPicker] onMapLoaded'); setMapReady(true); }}
        >
          {/* Using Google Maps tiles only (no OSM fallback) */}
          {origin ? <Marker coordinate={origin} pinColor="green" /> : null}
          {destination ? <Marker coordinate={destination} pinColor="red" /> : null}
          {routeGeo ? <Polyline coordinates={routeGeo} strokeColor="#0a84ff" strokeWidth={4} /> : null}
        </MapView>

          {/* If native map failed to initialize, show a web fallback */}
          {showWeb ? <MapWebFallback visible={showWeb} onClose={() => setShowWeb(false)} initialCenter={region} onSelect={(c) => {
            if (!origin) setOrigin(c);
            else if (!destination) setDestination(c);
            else { setOrigin(c); setDestination(null); setRouteGeo(null); setSummary(null); }
          }} /> : null}
            {/* Quick actions removed for cleaner inline UX (taps now set origin/destination directly) */}
        {/* Removed diagnostic badges to avoid covering map */}

        <View style={styles.toolbar}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText} numberOfLines={1}>Origen: {origin ? `${(Number(origin.latitude)).toFixed ? Number(origin.latitude).toFixed(5) : String(origin.latitude)}, ${(Number(origin.longitude)).toFixed ? Number(origin.longitude).toFixed(5) : String(origin.longitude)}` : '—'}</Text>
            <Text style={styles.infoText} numberOfLines={1}>Destino: {destination ? `${(Number(destination.latitude)).toFixed ? Number(destination.latitude).toFixed(5) : String(destination.latitude)}, ${(Number(destination.longitude)).toFixed ? Number(destination.longitude).toFixed(5) : String(destination.longitude)}` : '—'}</Text>
            {summary ? <Text style={styles.infoText}>Dist: {typeof summary.distance === 'number' ? (summary.distance/1000).toFixed(2) : String(summary.distance)} km • Dur: {typeof summary.duration === 'number' ? (summary.duration/60).toFixed(0) : String(summary.duration)} min</Text> : null}
          </View>
          <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.btn} onPress={onClose}><Text style={styles.btnText}>Cerrar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={buildRoute}><Text style={styles.btnText}>Trazar ruta</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleConfirm}><Text style={[styles.btnText, { color: '#fff' }]}>Confirmar</Text></TouchableOpacity>
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
  toolbar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#111',
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  btnText: { color: '#222', fontSize: 13 },
  primaryBtn: { backgroundColor: '#0a84ff' },

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
