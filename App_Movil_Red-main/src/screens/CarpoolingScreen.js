import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import MapPicker from '../components/MapPicker';
import PlaceAutocomplete from '../components/PlaceAutocomplete';

const TABS = ['Crear', 'Explorar', 'Mis Rutas', 'Mis Postulaciones'];

export default function CarpoolingScreen({ user: userProp }) {
  const [tab, setTab] = useState('Explorar');
  const [user, setUser] = useState(userProp || null);

  // Create form
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerCallback, setMapPickerCallback] = useState(null);
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('1');

  // Lists
  const [exploreRoutes, setExploreRoutes] = useState([]);
  const [myRoutes, setMyRoutes] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!userProp) {
        try {
          const auth = await loadAuth();
          if (auth && auth.user) setUser(auth.user);
        } catch (e) { console.debug('[Carpool] loadAuth failed', e); }
      }
    })();
  }, []);

  // Helper to safely format place fields that may be string or object {latitude, longitude, address}
  const formatPlace = (p) => {
    if (!p && p !== 0) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'number') return String(p);
    if (typeof p === 'object') {
      if (p.address) return p.address;
      if (p.display_name) return p.display_name;
      if ((p.latitude || p.lat) && (p.longitude || p.lon || p.lng)) {
        const lat = Number(p.latitude || p.lat).toFixed ? Number(p.latitude || p.lat).toFixed(5) : String(p.latitude || p.lat);
        const lon = Number(p.longitude || p.lon || p.lng).toFixed ? Number(p.longitude || p.lon || p.lng).toFixed(5) : String(p.longitude || p.lon || p.lng);
        return `${lat}, ${lon}`;
      }
      // As a last resort, try common nested fields
      const keys = ['origen', 'origin', 'from', 'address'];
      for (const k of keys) if (p[k]) return formatPlace(p[k]);
      return JSON.stringify(p);
    }
    return String(p);
  };

  useEffect(() => {
    // load initial explore when component mounts
    loadExplore();
  }, []);

  const loadExplore = async () => {
    setLoading(true);
    try {
      const res = await api.getCarpools();
      setExploreRoutes(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('[Carpool] loadExplore error', e);
      Alert.alert('Error', 'No se pudieron cargar las rutas.');
    } finally { setLoading(false); }
  };

  const loadMyRoutes = async () => {
    if (!user || !user.id_user) return;
    setLoading(true);
    try {
      const res = await api.getMyCarpools(user.id_user);
      setMyRoutes(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('[Carpool] loadMyRoutes error', e);
      Alert.alert('Error', 'No se pudieron cargar tus rutas.');
    } finally { setLoading(false); }
  };

  const loadMyApplications = async () => {
    if (!user || !user.id_user) return;
    setLoading(true);
    try {
      const res = await api.getMyApplications(user.id_user);
      setMyApplications(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('[Carpool] loadMyApplications error', e);
      Alert.alert('Error', 'No se pudieron cargar tus postulaciones.');
    } finally { setLoading(false); }
  };

  const onCreate = async () => {
    if (!origin.trim() || !destination.trim()) return Alert.alert('Completa origen y destino');
    const seats = parseInt(seatsTotal, 10) || 1;
    const payload = { origen: origin.trim(), destino: destination.trim(), hora_salida: departureTime.trim(), capacidad: seats };
    if (originCoords) payload.origin_coords = { lat: originCoords.latitude, lon: originCoords.longitude };
    if (destinationCoords) payload.destination_coords = { lat: destinationCoords.latitude, lon: destinationCoords.longitude };
    // include human-readable addresses
    payload.origin_address = origin.trim();
    payload.destination_address = destination.trim();
    setLoading(true);
    try {
      // attempt to compute route summary (distance/duration) client-side if ORS key available
      try {
        if (originCoords && destinationCoords) {
          const summary = await api.getRouteSummary(originCoords, destinationCoords).catch(() => null);
          if (summary) {
            payload.distancia_m = summary.distance; // meters
            payload.duracion_s = summary.duration; // seconds
          }
        }
      } catch (e) {
        console.debug('[Carpool] summary failed', e);
      }

      // If addresses empty or minimal, try reverse geocode for nicer strings
      try {
        if ((!payload.origin_address || payload.origin_address.length < 6) && originCoords) {
          const r = await api.reverseGeocode(originCoords.latitude, originCoords.longitude);
          if (r && r.display_name) payload.origin_address = r.display_name;
        }
        if ((!payload.destination_address || payload.destination_address.length < 6) && destinationCoords) {
          const r2 = await api.reverseGeocode(destinationCoords.latitude, destinationCoords.longitude);
          if (r2 && r2.display_name) payload.destination_address = r2.display_name;
        }
      } catch (e) { console.debug('[Carpool] reverse geocode failed', e); }

      await api.createCarpool(payload);
      Alert.alert('Éxito', 'Ruta creada');
      setOrigin(''); setDestination(''); setDepartureTime(''); setSeatsTotal('1');
      // refresh
      await loadExplore();
      await loadMyRoutes();
      setTab('Explorar');
    } catch (e) {
      console.warn('[Carpool] create failed', e);
      Alert.alert('Error', 'No se pudo crear la ruta');
    } finally { setLoading(false); }
  };

  const computeAvailable = (r) => {
    const total = Number(r.capacidad || r.seats_total || r.capacity || r.total_seats || 0);
    const taken = Number(r.seats_taken || r.ocupados || r.taken || r.applicants_count || r.postulantes_count || 0);
    return Math.max(0, total - taken);
  };

  const onApply = async (route) => {
    const available = computeAvailable(route);
    if (available <= 0) return Alert.alert('No disponible', 'No quedan cupos en esta ruta');
    setLoading(true);
    try {
      await api.applyToCarpool(route.id || route._id || route.id_ruta);
      Alert.alert('Postulado', 'Tu postulación fue registrada');
      await loadExplore();
      await loadMyApplications();
    } catch (e) {
      console.warn('[Carpool] apply failed', e);
      Alert.alert('Error', 'No se pudo postular');
    } finally { setLoading(false); }
  };

  const onCancelApplication = async (app) => {
    try {
      await api.cancelCarpoolApplication(app.id || app.application_id || app.id_postulacion || app.carpool_id);
      Alert.alert('Cancelada', 'Se canceló tu postulación');
      await loadMyApplications();
      await loadExplore();
    } catch (e) {
      console.warn('[Carpool] cancel application failed', e);
      Alert.alert('Error', 'No se pudo cancelar');
    }
  };

  const onRespond = async (application, action) => {
    try {
      await api.respondToApplication(application.id || application.application_id || application.id_postulacion, action === 'aceptar' ? 'accept' : 'reject');
      Alert.alert('OK', `Solicitud ${action}`);
      await loadMyRoutes();
    } catch (e) {
      console.warn('[Carpool] respond failed', e);
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    }
  };

  const renderRouteItem = ({ item }) => {
    const available = computeAvailable(item);
    const from = formatPlace(item.origen || item.origin || item.from);
    const to = formatPlace(item.destino || item.destination || item.to);
    return (
      <View style={styles.route}>
        <Text style={{ fontWeight: '700' }}>{from} → {to}</Text>
        <Text>{item.hora_salida || item.departure_time || item.time || ''} • Capacidad: {item.capacidad || item.seats_total || item.capacity || '-'} • Disponibles: {available}</Text>
        <Text style={{ color: '#444' }}>{item.descripcion || item.description || ''}</Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Button title="Ver" onPress={() => {
            // show basic details (could be expanded)
            Alert.alert('Ruta', `${from} → ${to}\nHora: ${item.hora_salida || item.departure_time || ''}\nDisponibles: ${available}`);
          }} />
          <View style={{ width: 8 }} />
          <Button title="Postular" onPress={() => onApply(item)} disabled={available <= 0} />
        </View>
      </View>
    );
  };

  const renderMyRouteItem = ({ item }) => {
    const from = formatPlace(item.origen || item.origin || item.from);
    const to = formatPlace(item.destino || item.destination || item.to);
    return (
      <View style={styles.route}>
        <Text style={{ fontWeight: '700' }}>{from} → {to}</Text>
        <Text>Capacidad: {item.capacidad || item.seats_total || item.capacity || '-'}</Text>
        <Text style={{ marginTop: 8, fontWeight: '600' }}>Postulaciones:</Text>
        <ApplicationsList carpool={item} onRespond={onRespond} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carpooling</Text>
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => { setTab(t); if (t === 'Mis Rutas') loadMyRoutes(); if (t === 'Mis Postulaciones') loadMyApplications(); if (t === 'Explorar') loadExplore(); }} style={[styles.tabBtn, tab === t && styles.tabActive]}>
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1, padding: 12 }}>
        {loading ? <ActivityIndicator /> : null}

        {tab === 'Crear' && (
          <View>
            <PlaceAutocomplete placeholder="Buscar origen (escribe dirección)" onSelect={(p) => { setOrigin(p.name); setOriginCoords({ latitude: p.latitude, longitude: p.longitude }); }} />
            <TouchableOpacity style={[styles.input, { justifyContent: 'center', marginBottom: 8 }]} onPress={() => { setMapPickerCallback('origin'); setMapPickerVisible(true); }}>
              <Text>{origin ? `Origen: ${origin}` : '... o seleccionar origen en el mapa'}</Text>
            </TouchableOpacity>

            <PlaceAutocomplete placeholder="Buscar destino (escribe dirección)" onSelect={(p) => { setDestination(p.name); setDestinationCoords({ latitude: p.latitude, longitude: p.longitude }); }} />
            <TouchableOpacity style={[styles.input, { justifyContent: 'center', marginBottom: 8 }]} onPress={() => { setMapPickerCallback('destination'); setMapPickerVisible(true); }}>
              <Text>{destination ? `Destino: ${destination}` : '... o seleccionar destino en el mapa'}</Text>
            </TouchableOpacity>

            <TextInput placeholder="Hora de salida" value={departureTime} onChangeText={setDepartureTime} style={styles.input} />
            <TextInput placeholder="Capacidad (número)" value={seatsTotal} onChangeText={setSeatsTotal} style={styles.input} keyboardType="numeric" />
            <Button title="Crear ruta" onPress={onCreate} />
          </View>
        )}

        {tab === 'Explorar' && (
          <FlatList data={exploreRoutes} keyExtractor={r => String(r.id || r._id || Math.random())} renderItem={renderRouteItem} ListEmptyComponent={<Text>No hay rutas</Text>} />
        )}

        {tab === 'Mis Rutas' && (
          <FlatList data={myRoutes} keyExtractor={r => String(r.id || r._id || Math.random())} renderItem={renderMyRouteItem} ListEmptyComponent={<Text>No tienes rutas creadas</Text>} />
        )}

        {tab === 'Mis Postulaciones' && (
          <FlatList data={myApplications} keyExtractor={a => String(a.id || a.application_id || Math.random())} renderItem={({item}) => (
            <View style={styles.route}>
              <Text style={{ fontWeight: '700' }}>{formatPlace((item.carpool && (item.carpool.origen || item.carpool.origin)) || item.origen || item.origin)}</Text>
              <Text>Estado: {item.estado || item.status || item.state || 'pendiente'}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button title="Cancelar" onPress={() => onCancelApplication(item)} />
              </View>
            </View>
          )} ListEmptyComponent={<Text>No tienes postulaciones</Text>} />
        )}
      </View>
      <MapPicker visible={mapPickerVisible} initialRegion={null} onClose={() => setMapPickerVisible(false)} onConfirm={(res) => {
        // res: { origin, destination, routeGeo, summary }
        if (mapPickerCallback === 'origin') {
          setOrigin(`${res.origin.latitude.toFixed(5)}, ${res.origin.longitude.toFixed(5)}`);
          setOriginCoords(res.origin);
        } else if (mapPickerCallback === 'destination') {
          setDestination(`${res.destination.latitude.toFixed(5)}, ${res.destination.longitude.toFixed(5)}`);
          setDestinationCoords(res.destination);
        }
      }} />
    </View>
  );
}

function ApplicationsList({ carpool, onRespond }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCarpoolApplications(carpool.id || carpool._id || carpool.id_ruta);
      setApps(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('[ApplicationsList] load error', e);
    } finally { setLoading(false); }
  };

  if (loading) return <Text>Cargando postulaciones...</Text>;
  if (!apps || apps.length === 0) return <Text>No hay postulaciones</Text>;

  return (
    <View>
      {apps.map(a => (
        <View key={a.id || a.application_id || Math.random()} style={{ paddingVertical: 6, borderTopWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontWeight: '600' }}>{(a.usuario && (a.usuario.nombre || a.usuario)) || a.user || a.email || 'Usuario'}</Text>
          <Text>Asientos solicitados: {a.seats || a.solicitados || 1}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Button title="Aceptar" onPress={() => onRespond(a, 'aceptar')} />
            <View style={{ width: 8 }} />
            <Button title="Rechazar" onPress={() => onRespond(a, 'rechazar')} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, marginBottom: 8, borderRadius: 6 },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tabBtn: { flex: 1, padding: 8, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#0a84ff' },
  tabText: { color: '#444' },
  tabTextActive: { color: '#0a84ff', fontWeight: '700' },
  route: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
});
