import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal } from 'react-native';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapPicker from '../components/MapPicker';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import TimeSelector from '../components/TimeSelector';
import { Button, Card, Avatar } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

const TABS = ['Crear', 'Explorar', 'Mis Rutas', 'Mis Postulaciones'];

export default function CarpoolingScreen({ user: userProp }) {
  const { theme } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabBtn: { 
      flex: 1, 
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    tabActive: { 
      borderBottomColor: theme.colors.primary,
    },
    tabIcon: {
      fontSize: 18,
      marginBottom: 2,
    },
    tabText: { 
      color: theme.colors.textLight,
      fontSize: 11,
      fontWeight: '500',
    },
    tabTextActive: { 
      color: theme.colors.primary,
      fontWeight: '700',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: theme.spacing.md,
    },
    emptyContainer: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textLight,
      textAlign: 'center',
    },
    routeCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    routeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    routeHeaderInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    driverName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    routeTime: {
      fontSize: 13,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    availableBadge: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignItems: 'center',
      minWidth: 42,
    },
    availableBadgeText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    availableBadgeLabel: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    routeBody: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    routeLocation: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    routeIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    routeLocationInfo: {
      flex: 1,
    },
    routeLocationLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textLight,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    routeLocationText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    routeDivider: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    routeArrow: {
      fontSize: 20,
      color: theme.colors.textLight,
    },
    routeDescription: {
      fontSize: 13,
      color: theme.colors.textLight,
      fontStyle: 'italic',
      marginBottom: theme.spacing.sm,
    },
    routeFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    routeStats: {
      flex: 1,
    },
    routeStatItem: {
      fontSize: 13,
      color: theme.colors.textLight,
    },
    routeActions: {
      flexDirection: 'row',
      gap: 8,
      flex: 1,
    },
    infoButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoButtonText: {
      fontSize: 18,
    },
    myRouteCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    miniMapContainer: {
      height: 180,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    miniMap: {
      flex: 1,
      height: 180,
    },
    myRouteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    myRouteTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    myRouteTime: {
      fontSize: 13,
      color: theme.colors.textLight,
    },
    capacityInfo: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    capacityText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '600',
    },
    applicationsSection: {
      marginTop: theme.spacing.sm,
    },
    applicationsTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    applicationItem: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    applicantName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    applicantSeats: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    applicationCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    applicationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    applicationTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statusBadge: {
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    applicationRoute: {
      fontSize: 14,
      color: theme.colors.text,
    },
    createForm: {
      flex: 1,
    },
    createFormContent: {
      padding: theme.spacing.lg,
    },
    formSection: {
      marginBottom: theme.spacing.lg,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    input: { 
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 15,
      color: theme.colors.text,
    },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    mapButtonIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    mapButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    mapContainer: {
      height: 360,
      marginBottom: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    createButton: {
      marginTop: theme.spacing.md,
    },
  }), [theme]);
  
  const [tab, setTab] = useState('Explorar');
  const [user, setUser] = useState(userProp || null);

  // Create form
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [previewMapVisible, setPreviewMapVisible] = useState(false);
  const [previewOrigin, setPreviewOrigin] = useState(null);
  const [previewDestination, setPreviewDestination] = useState(null);
  const [previewRouteGeo, setPreviewRouteGeo] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('1');
  const weekdayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const [daysSelected, setDaysSelected] = useState([weekdayNames[new Date().getDay()]]);

  const toggleDay = (d) => {
    setDaysSelected((cur) => {
      if (!cur) return [d];
      if (cur.includes(d)) return cur.filter(x => x !== d);
      return [...cur, d];
    });
  };

  // Lists
  const [exploreRoutes, setExploreRoutes] = useState([]);
  const [myRoutes, setMyRoutes] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const checkAuth = async () => {
    try {
      const a = await loadAuth();
      console.log('[Carpool] stored auth', a);
      // Call validate-token and log very detailed info for debugging
      // Use the API v1 path (consistent with other calls)
      const res = await api.request('/api/v1/auth/validate-token', { method: 'POST' });
      console.log('[Carpool] validate-token', res);
      try { Alert.alert('Token info', JSON.stringify(res)); } catch (aErr) { console.warn('[Carpool] Alert failed', aErr); }
    } catch (e) {
      // Enhanced error logging to capture details from different environments
      try {
        console.warn('[Carpool] validate-token failed (raw)', e);
        // If it's an object with properties, log keys and known fields
        if (e && typeof e === 'object') {
          try { console.warn('[Carpool] error keys', Object.keys(e)); } catch (kErr) { console.warn('[Carpool] error.keys failed', kErr); }
          try { if (e.stack) console.warn('[Carpool] stack', e.stack); } catch (sErr) { /* ignore */ }
          try {
            const body = e.body || e.bodyText || e.message || null;
            if (body) console.warn('[Carpool] error body/text/message', body);
            // attempt safe stringify
            try { console.warn('[Carpool] error (stringified)', JSON.stringify(e)); } catch (jErr) { console.warn('[Carpool] stringify error', jErr); }
          } catch (inner) { console.warn('[Carpool] inner error logging failed', inner); }
        }
      } catch (logErr) {
        console.warn('[Carpool] validate-token failed (logging failed)', logErr);
      }
      // Show user-friendly alert with best available info
      let alertMsg = 'Validación de token fallida';
      try {
        if (e && (e.bodyText || e.body)) alertMsg += ': ' + (typeof e.body === 'string' ? e.body : JSON.stringify(e.body || e.bodyText));
        else if (e && e.message) alertMsg += ': ' + e.message;
        else alertMsg += ': ' + String(e);
      } catch (formatErr) {
        alertMsg += ' (error al formatear detalles)';
      }
      try { Alert.alert('Error', alertMsg); } catch (aErr) { console.warn('[Carpool] Alert failed', aErr); }
    }
  };

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

  // Try parsing a coordinate string like "lat,lon" or object -> { latitude, longitude }
  const parseCoord = (v) => {
    if (!v && v !== 0) return null;

    // If it's an object, extract coordinates
    if (typeof v === 'object' && v !== null) {
      const lat = Number(v.latitude || v.lat || v.latitud);
      const lon = Number(v.longitude || v.lon || v.lng || v.longitud || v.long);
      if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat !== 0 && lon !== 0) {
        return { latitude: lat, longitude: lon };
      }
      return null;
    }

    // If it's a string, try to parse it
    if (typeof v === 'string') {
      // Remove all whitespace
      const cleaned = v.trim().replace(/\s+/g, '');

      // Try parsing "lat,lon" format
      const parts = cleaned.split(',');
      if (parts.length >= 2) {
        const lat = Number(parts[0]);
        const lon = Number(parts[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat !== 0 && lon !== 0) {
          return { latitude: lat, longitude: lon };
        }
      }
    }

    return null;
  };

  // Normalize route geometry (accepts GeoJSON coords [[lon,lat],...] or [{latitude,longitude},...])
  const normalizeRouteGeo = (g) => {
    if (!g) return null;
    if (!Array.isArray(g)) return null;
    try {
      const coords = g.map(pt => {
        if (!pt) return null;
        if (Array.isArray(pt) && pt.length >= 2) {
          // geojson [lon, lat]
          return { latitude: Number(pt[1]), longitude: Number(pt[0]) };
        }
        if (typeof pt === 'object') {
          if (pt.latitude !== undefined && pt.longitude !== undefined) return { latitude: Number(pt.latitude), longitude: Number(pt.longitude) };
          if (pt.lat !== undefined && (pt.lon !== undefined || pt.lng !== undefined)) return { latitude: Number(pt.lat), longitude: Number(pt.lon || pt.lng) };
        }
        return null;
      }).filter(Boolean);
      return coords.length ? coords : null;
    } catch (e) {
      console.warn('[Carpool] normalizeRouteGeo failed', e);
      return null;
    }
  };

  useEffect(() => {
    // load initial explore when component mounts
    loadExplore();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === 'Explorar') await loadExplore();
      else if (tab === 'Mis Rutas') await loadMyRoutes();
      else if (tab === 'Mis Postulaciones') await loadMyApplications();
    } finally {
      setRefreshing(false);
    }
  };

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
      // use route summary computed by the embedded map if available, otherwise try API
      try {
        if (routeSummary && (typeof routeSummary.distance !== 'undefined')) {
          payload.distancia_m = routeSummary.distance;
          payload.duracion_s = routeSummary.duration;
        } else if (originCoords && destinationCoords) {
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

      // Map payload to backend expected field names/format
      const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
      const ensureHHMMSS = (s) => {
        if (!s) return `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:00`;
        // If already HH:MM:SS
        const m1 = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (m1) return `${pad(Number(m1[1]))}:${pad(Number(m1[2]))}:${pad(Number(m1[3]))}`;
        const m2 = s.match(/^(\d{1,2}):(\d{2})/);
        if (m2) return `${pad(Number(m2[1]))}:${pad(Number(m2[2]))}:00`;
        return s;
      };

      const backendPayload = Object.assign({}, payload);
      // punto_inicio / punto_destino expected as strings by backend (e.g. address or "lat, lon")
      backendPayload.punto_inicio = backendPayload.origin_address || (originCoords ? `${originCoords.latitude}, ${originCoords.longitude}` : '');
      backendPayload.punto_destino = backendPayload.destination_address || (destinationCoords ? `${destinationCoords.latitude}, ${destinationCoords.longitude}` : '');

      // hora_salida strict format
      backendPayload.hora_salida = ensureHHMMSS(departureTime || payload.hora_salida);

      // dias_disponibles required by backend - send as comma-separated string with capitalized names
      if (Array.isArray(daysSelected) && daysSelected.length) backendPayload.dias_disponibles = daysSelected.join(',');
      else backendPayload.dias_disponibles = weekdayNames.slice(1).join(',');

      // capacidad_ruta expected name
      backendPayload.capacidad_ruta = Number(seatsTotal) || Number(payload.capacidad) || 1;

      // also keep backwards-compatible keys
      backendPayload.origen = payload.origen;
      backendPayload.destino = payload.destino;

      await api.createCarpool(backendPayload);
      Alert.alert('Éxito', 'Ruta creada');
      setOrigin(''); setDestination(''); setDepartureTime(''); setSeatsTotal('1');
      setRouteGeo(null); setRouteSummary(null); setOriginCoords(null); setDestinationCoords(null);
      // refresh
      await loadExplore();
      await loadMyRoutes();
      setTab('Explorar');
    } catch (e) {
      console.warn('[Carpool] create failed', e);
      // Show more detailed backend error if available
      try {
        const msg = e && (e.body || e.bodyText || e.message) ? JSON.stringify(e.body || e.bodyText || e.message) : String(e);
        Alert.alert('Error', 'No se pudo crear la ruta', [{ text: 'OK' }], { cancelable: true });
        console.warn('[Carpool] backend error detail', msg);
        // show a smaller toast-like alert with details (second alert)
        Alert.alert('Detalles', msg);
      } catch (xx) {
        Alert.alert('Error', 'No se pudo crear la ruta');
      }
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
    const from = formatPlace(item.origen || item.punto_inicio || item.origin || item.from);
    const to = formatPlace(item.destino || item.punto_destino || item.destination || item.to);
    const driverName = item.conductor?.nombre || item.driver?.nombre || item.creator?.nombre || 'Conductor';
    const capacity = item.capacidad || item.seats_total || item.capacity || item.capacidad_ruta || '-';
    // try parse coordinates for preview - check punto_inicio/punto_destino first (backend fields)
    const coordFrom = parseCoord(item.punto_inicio || item.origen || item.origin_coords || item.origin_coord || item.origin);
    const coordTo = parseCoord(item.punto_destino || item.destino || item.destination_coords || item.destination_coord || item.destination);
    const routeGeo = item.route_geo || item.routeGeo || item.geometry || item.geojson || item.geometry_geo || null;

    // Only show map if we have at least origin or destination coordinates
    const showMap = coordFrom || coordTo;
    
    return (
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Avatar name={driverName} size={48} />
          <View style={styles.routeHeaderInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.routeTime}>🕐 {item.hora_salida || item.departure_time || item.time || 'Sin hora'}</Text>
          </View>
          <View style={styles.availableBadge}>
            <Text style={styles.availableBadgeText}>{available}</Text>
            <Text style={styles.availableBadgeLabel}>libres</Text>
          </View>
        </View>
        
        <View style={styles.routeBody}>
          <View style={styles.routeLocation}>
            <Text style={styles.routeIcon}>📍</Text>
            <View style={styles.routeLocationInfo}>
              <Text style={styles.routeLocationLabel}>Origen</Text>
              <Text style={styles.routeLocationText} numberOfLines={2}>{from}</Text>
            </View>
          </View>
          
          <View style={styles.routeDivider}>
            <Text style={styles.routeArrow}>↓</Text>
          </View>
          
          <View style={styles.routeLocation}>
            <Text style={styles.routeIcon}>🎯</Text>
            <View style={styles.routeLocationInfo}>
              <Text style={styles.routeLocationLabel}>Destino</Text>
              <Text style={styles.routeLocationText} numberOfLines={2}>{to}</Text>
            </View>
          </View>
        </View>

        {showMap ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => {
            // open full map preview modal
            setPreviewOrigin(coordFrom);
            setPreviewDestination(coordTo);
            setPreviewRouteGeo(normalizeRouteGeo(routeGeo) || null);
            setPreviewMapVisible(true);
          }}>
            <View style={styles.miniMapContainer}>
              <MapView
                provider={null}
                style={styles.miniMap}
                mapType="standard"
                initialRegion={(() => {
                  const fallback = { latitude: -19.0196, longitude: -65.2619, latitudeDelta: 0.02, longitudeDelta: 0.02 };
                  if (!coordFrom && !coordTo) return fallback;

                  const a = coordFrom || coordTo || fallback;
                  const b = coordTo || coordFrom || a;
                  const latDelta = Math.max(0.005, Math.abs((a.latitude || 0) - (b.latitude || 0)) * 1.6);
                  const lonDelta = Math.max(0.005, Math.abs((a.longitude || 0) - (b.longitude || 0)) * 1.6);
                  return {
                    latitude: ((a.latitude || 0) + (b.latitude || 0)) / 2,
                    longitude: ((a.longitude || 0) + (b.longitude || 0)) / 2,
                    latitudeDelta: Math.min(latDelta, 0.3),
                    longitudeDelta: Math.min(lonDelta, 0.3)
                  };
                })()}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {coordFrom ? <Marker coordinate={coordFrom} pinColor="green" title="Origen" /> : null}
                {coordTo ? <Marker coordinate={coordTo} pinColor="red" title="Destino" /> : null}
                {Array.isArray(normalizeRouteGeo(routeGeo)) ? (
                  <Polyline coordinates={normalizeRouteGeo(routeGeo)} strokeColor="#0a84ff" strokeWidth={4} />
                ) : null}
              </MapView>
            </View>
          </TouchableOpacity>
        ) : null}

        {item.descripcion || item.description ? (
          <Text style={styles.routeDescription}>{item.descripcion || item.description}</Text>
        ) : null}

        <View style={styles.routeFooter}>
          <View style={styles.routeStats}>
            <Text style={styles.routeStatItem}>👥 {capacity} asientos</Text>
          </View>
          <View style={styles.routeActions}>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                Alert.alert('📍 Detalles de Ruta', `🚗 Conductor: ${driverName}\n\n📍 Origen:\n${from}\n\n🎯 Destino:\n${to}\n\n🕐 Hora: ${item.hora_salida || item.departure_time || 'Sin especificar'}\n\n👥 Capacidad: ${item.capacidad || item.seats_total || item.capacity || 0}\n✅ Disponibles: ${available}`);
              }}
            >
              <Text style={styles.infoButtonText}>ℹ️</Text>
            </TouchableOpacity>
            <Button
              variant={available > 0 ? 'primary' : 'disabled'}
              size="sm"
              onPress={() => onApply(item)}
              disabled={available <= 0}
              style={{ flex: 1 }}
            >
              {available > 0 ? '✓ Postular' : 'Sin cupos'}
            </Button>
          </View>
        </View>
      </View>
    );
  };

  const renderMyRouteItem = ({ item }) => {
    const from = formatPlace(item.origen || item.punto_inicio || item.origin || item.from);
    const to = formatPlace(item.destino || item.punto_destino || item.destination || item.to);
    const capacity = item.capacidad || item.seats_total || item.capacity || item.capacidad_ruta || '-';
    // try parse coordinates for preview - check punto_inicio/punto_destino first (backend fields)
    const coordFrom = parseCoord(item.punto_inicio || item.origen || item.origin_coords || item.origin_coord || item.origin);
    const coordTo = parseCoord(item.punto_destino || item.destino || item.destination_coords || item.destination_coord || item.destination);
    const routeGeo = item.route_geo || item.routeGeo || item.geometry || item.geojson || item.geometry_geo || null;

    // Only show map if we have at least origin or destination coordinates
    const showMap = coordFrom || coordTo;
    return (
      <View style={styles.myRouteCard}>
        <View style={styles.myRouteHeader}>
          <Text style={styles.myRouteTitle}>🚗 Mi Ruta</Text>
          <Text style={styles.myRouteTime}>🕐 {item.hora_salida || item.departure_time || item.time || 'Sin hora'}</Text>
        </View>
        
        <View style={styles.routeBody}>
          <View style={styles.routeLocation}>
            <Text style={styles.routeIcon}>📍</Text>
            <View style={styles.routeLocationInfo}>
              <Text style={styles.routeLocationLabel}>Origen</Text>
              <Text style={styles.routeLocationText} numberOfLines={2}>{from}</Text>
            </View>
          </View>
          
          <View style={styles.routeDivider}>
            <Text style={styles.routeArrow}>↓</Text>
          </View>
          
          <View style={styles.routeLocation}>
            <Text style={styles.routeIcon}>🎯</Text>
            <View style={styles.routeLocationInfo}>
              <Text style={styles.routeLocationLabel}>Destino</Text>
              <Text style={styles.routeLocationText} numberOfLines={2}>{to}</Text>
            </View>
          </View>
        </View>

        {showMap ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => {
            // open full map preview modal
            setPreviewOrigin(coordFrom);
            setPreviewDestination(coordTo);
            setPreviewRouteGeo(normalizeRouteGeo(routeGeo) || null);
            setPreviewMapVisible(true);
          }}>
            <View style={styles.miniMapContainer}>
              <MapView
                provider={null}
                style={styles.miniMap}
                mapType="standard"
                initialRegion={(() => {
                  const fallback = { latitude: -19.0196, longitude: -65.2619, latitudeDelta: 0.02, longitudeDelta: 0.02 };
                  if (!coordFrom && !coordTo) return fallback;

                  const a = coordFrom || coordTo || fallback;
                  const b = coordTo || coordFrom || a;
                  const latDelta = Math.max(0.005, Math.abs((a.latitude || 0) - (b.latitude || 0)) * 1.6);
                  const lonDelta = Math.max(0.005, Math.abs((a.longitude || 0) - (b.longitude || 0)) * 1.6);
                  return {
                    latitude: ((a.latitude || 0) + (b.latitude || 0)) / 2,
                    longitude: ((a.longitude || 0) + (b.longitude || 0)) / 2,
                    latitudeDelta: Math.min(latDelta, 0.3),
                    longitudeDelta: Math.min(lonDelta, 0.3)
                  };
                })()}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {coordFrom ? <Marker coordinate={coordFrom} pinColor="green" title="Origen" /> : null}
                {coordTo ? <Marker coordinate={coordTo} pinColor="red" title="Destino" /> : null}
                {Array.isArray(normalizeRouteGeo(routeGeo)) ? (
                  <Polyline coordinates={normalizeRouteGeo(routeGeo)} strokeColor="#0a84ff" strokeWidth={4} />
                ) : null}
              </MapView>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.capacityInfo}>
          <Text style={styles.capacityText}>👥 Capacidad total: {capacity}</Text>
        </View>
        
        <View style={styles.applicationsSection}>
          <Text style={styles.applicationsTitle}>📋 Postulaciones</Text>
          <ApplicationsList carpool={item} onRespond={onRespond} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Carpooling</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        {TABS.map(t => {
          const icons = { 'Crear': '➕', 'Explorar': '🔍', 'Mis Rutas': '🚗', 'Mis Postulaciones': '📝' };
          return (
            <TouchableOpacity 
              key={t} 
              onPress={() => { 
                setTab(t); 
                if (t === 'Mis Rutas') loadMyRoutes(); 
                if (t === 'Mis Postulaciones') loadMyApplications(); 
                if (t === 'Explorar') loadExplore(); 
              }} 
              style={[styles.tabBtn, tab === t && styles.tabActive]}
            >
              <Text style={styles.tabIcon}>{icons[t]}</Text>
              <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>

        {tab === 'Crear' && (
          <ScrollView style={styles.createForm} contentContainerStyle={styles.createFormContent}>
            <Text style={[styles.formLabel, { marginBottom: 8 }]}>🗺️ Mapa Interactivo</Text>
            <Text style={{ fontSize: 12, color: theme.colors.textLight, marginBottom: 8 }}>
              1️⃣ Toca en el mapa para marcar ORIGEN • 2️⃣ Toca otra vez para DESTINO • 3️⃣ Presiona "Trazar" para ver la ruta
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.error, marginBottom: 8, fontStyle: 'italic' }}>
              ⚠️ Si el mapa no aparece: Asegúrate de que Google Play Services esté actualizado y que la app tenga permisos de ubicación
            </Text>
            <View style={styles.mapContainer}>
              <MapPicker
                inline={true}
                initialRegion={{ latitude: -19.0196, longitude: -65.2619, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
                onChange={(p) => {
                  // p: { origin } or { destination }
                  if (p.origin) {
                    setOrigin(`${p.origin.latitude.toFixed(5)}, ${p.origin.longitude.toFixed(5)}`);
                    setOriginCoords(p.origin);
                  }
                  if (p.destination) {
                    setDestination(`${p.destination.latitude.toFixed(5)}, ${p.destination.longitude.toFixed(5)}`);
                    setDestinationCoords(p.destination);
                  }
                }}
                onConfirm={(res) => {
                  console.log('[CarpoolingScreen] MapPicker onConfirm', res);
                  if (res && res.origin && res.destination) {
                    setOrigin(`${res.origin.latitude.toFixed(5)}, ${res.origin.longitude.toFixed(5)}`);
                    setOriginCoords(res.origin);
                    setDestination(`${res.destination.latitude.toFixed(5)}, ${res.destination.longitude.toFixed(5)}`);
                    setDestinationCoords(res.destination);
                    setRouteGeo(res.routeGeo || null);
                    setRouteSummary(res.summary || null);
                  }
                }}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>📍 Punto de Partida</Text>
              <PlaceAutocomplete 
                placeholder="Buscar dirección de origen" 
                value={origin}
                onSelect={(p) => { 
                  setOrigin(p.name); 
                  setOriginCoords({ latitude: p.latitude, longitude: p.longitude }); 
                }} 
              />
              <TouchableOpacity onPress={checkAuth} style={{ marginTop: 8 }}>
                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>Verificar sesión / token</Text>
              </TouchableOpacity>
              <Text style={{ marginTop: 8, color: theme.colors.textLight, fontSize: 12 }}>O selecciona el punto en el mapa arriba (primer toque = origen)</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>🎯 Destino</Text>
              <PlaceAutocomplete 
                placeholder="Buscar dirección de destino" 
                value={destination}
                onSelect={(p) => { 
                  setDestination(p.name); 
                  setDestinationCoords({ latitude: p.latitude, longitude: p.longitude }); 
                }} 
              />
              <Text style={{ marginTop: 8, color: theme.colors.textLight, fontSize: 12 }}>O selecciona el punto en el mapa arriba (segundo toque = destino)</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>🕐 Hora de Salida</Text>
              <TimeSelector
                value={departureTime}
                onChange={(v) => setDepartureTime(v)}
                placeholder="Seleccionar hora"
              />
              <Text style={{ marginTop: 8, color: theme.colors.textLight, fontSize: 12 }}>Toca para elegir la hora. Se enviará en formato HH:MM:SS</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>📅 Días disponibles</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {weekdayNames.slice(1).map((d) => (
                  <TouchableOpacity key={d} onPress={() => toggleDay(d)} style={{ padding: 8, margin: 4, borderRadius: 6, backgroundColor: daysSelected && daysSelected.includes(d) ? theme.colors.primary : theme.colors.card }}>
                    <Text style={{ color: daysSelected && daysSelected.includes(d) ? '#fff' : theme.colors.text }}>{d.substr(0,3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ marginTop: 8, color: theme.colors.textLight, fontSize: 12 }}>Selecciona los días en que la ruta está disponible.</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>👥 Capacidad (asientos disponibles)</Text>
              <TextInput 
                placeholder="Número de asientos" 
                value={seatsTotal} 
                onChangeText={setSeatsTotal} 
                style={styles.input} 
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <Button 
              variant="primary" 
              onPress={onCreate}
              style={styles.createButton}
            >
              ✓ Crear Ruta
            </Button>
          </ScrollView>
        )}

        {tab === 'Explorar' && (
          <FlatList 
            data={exploreRoutes} 
            keyExtractor={r => String(r.id || r._id || Math.random())} 
            renderItem={renderRouteItem} 
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No hay rutas disponibles</Text>
                <Text style={styles.emptySubtext}>Sé el primero en crear una ruta</Text>
              </View>
            } 
          />
        )}

        {tab === 'Mis Rutas' && (
          <FlatList 
            data={myRoutes} 
            keyExtractor={r => String(r.id || r._id || Math.random())} 
            renderItem={renderMyRouteItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyText}>No tienes rutas creadas</Text>
                <Text style={styles.emptySubtext}>Crea tu primera ruta en la pestaña "Crear"</Text>
              </View>
            } 
          />
        )}

        {tab === 'Mis Postulaciones' && (
          <FlatList 
            data={myApplications} 
            keyExtractor={a => String(a.id || a.application_id || Math.random())} 
            renderItem={({item}) => {
              const statusColors = {
                'pendiente': theme.colors.warning,
                'aceptada': theme.colors.secondary,
                'rechazada': theme.colors.error,
                'pending': theme.colors.warning,
                'accepted': theme.colors.secondary,
                'rejected': theme.colors.error,
              };
              const status = item.estado || item.status || item.state || 'pendiente';
              const statusColor = statusColors[status.toLowerCase()] || theme.colors.textLight;
              
              return (
                <View style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <Text style={styles.applicationTitle}>📍 Postulación</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusBadgeText}>{status}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.applicationRoute}>
                    {formatPlace((item.carpool && (item.carpool.origen || item.carpool.origin)) || item.origen || item.origin)}
                  </Text>
                  
                  {status.toLowerCase() === 'pendiente' || status.toLowerCase() === 'pending' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onPress={() => onCancelApplication(item)}
                      style={{ marginTop: 12 }}
                    >
                      ✕ Cancelar Postulación
                  {/* Full-screen preview modal for route */}
                  <Modal visible={previewMapVisible} animationType="slide">
                    <View style={{ flex: 1 }}>
                      <MapView
                        provider={MapView.PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        mapType="standard"
                        initialRegion={(() => {
                          const fallback = { latitude: -19.0196, longitude: -65.2619 };
                          const a = previewOrigin || (previewRouteGeo && previewRouteGeo[0]) || fallback;
                          const b = previewDestination || (previewRouteGeo && previewRouteGeo[previewRouteGeo.length-1]) || a;
                          const latDelta = Math.max(0.01, Math.abs((a.latitude || 0) - (b.latitude || 0)) * 1.6);
                          const lonDelta = Math.max(0.01, Math.abs((a.longitude || 0) - (b.longitude || 0)) * 1.6);
                          return { latitude: ((a.latitude || 0) + (b.latitude || 0)) / 2, longitude: ((a.longitude || 0) + (b.longitude || 0)) / 2, latitudeDelta: Math.min(latDelta, 1), longitudeDelta: Math.min(lonDelta, 1) };
                        })()}
                      >
                        {previewOrigin ? <Marker coordinate={previewOrigin} pinColor="green" /> : null}
                        {previewDestination ? <Marker coordinate={previewDestination} pinColor="red" /> : null}
                        {Array.isArray(previewRouteGeo) ? (
                          <Polyline coordinates={previewRouteGeo} strokeColor="#0a84ff" strokeWidth={4} />
                        ) : null}
                      </MapView>
                      <View style={{ position: 'absolute', top: 40, right: 12 }}>
                        <TouchableOpacity onPress={() => setPreviewMapVisible(false)} style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}>
                          <Text>Cerrar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                    </Button>
                  ) : null}
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>No tienes postulaciones</Text>
                <Text style={styles.emptySubtext}>Explora rutas y postúlate a una</Text>
              </View>
            } 
          />
        )}
      </View>
      )}
      
    </View>
  );
}

function ApplicationsList({ carpool, onRespond }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const localStyles = {
    applicationItem: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    applicantName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    applicantSeats: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
    },
  };

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

  if (loading) return (
    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textLight, marginTop: 8, fontSize: 12 }}>Cargando postulaciones...</Text>
    </View>
  );
  
  if (!apps || apps.length === 0) return (
    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ color: theme.colors.textLight, fontSize: 14 }}>📭 No hay postulaciones aún</Text>
    </View>
  );

  return (
    <View style={{ marginTop: 8 }}>
      {apps.map(a => {
        const userName = (a.usuario && (a.usuario.nombre || a.usuario)) || a.user || a.email || 'Usuario';
        return (
          <View key={a.id || a.application_id || Math.random()} style={localStyles.applicationItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Avatar name={userName} size={36} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={localStyles.applicantName}>{userName}</Text>
                <Text style={localStyles.applicantSeats}>🪑 {a.seats || a.solicitados || 1} asiento(s)</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button 
                variant="primary" 
                size="sm"
                onPress={() => onRespond(a, 'aceptar')}
                style={{ flex: 1 }}
              >
                ✓ Aceptar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => onRespond(a, 'rechazar')}
                style={{ flex: 1 }}
              >
                ✕ Rechazar
              </Button>
            </View>
          </View>
        );
      })}
    </View>
  );
}
