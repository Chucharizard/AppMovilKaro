// API helper library
import { BACKEND_URL, ORS_API_KEY } from '../config';
import { loadAuth, clearAuth } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function request(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  try {
    const debugMethod = (options && options.method) || 'GET';
    const debugHeaders = (options && options.headers) || { 'Content-Type': 'application/json' };
    const debugBody = options && options.body;
    console.log('[api.request] ->', { url, method: debugMethod, headers: debugHeaders, body: debugBody });
  } catch (e) {
    console.warn('[api.request] debug log failed', e);
  }

  let auth = null;
  try {
    auth = await loadAuth();
  } catch (e) {
    // ignore
  }

  const headers = Object.assign({}, options.headers || {});
  // If body is FormData, let fetch set the Content-Type (with boundary).
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (auth && auth.access_token) headers.Authorization = `Bearer ${auth.access_token}`;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const suppress = options && options._suppressWarns;
      // Si es 401, borrar credenciales locales para forzar re-login
      if (res.status === 401) {
        try {
          await clearAuth();
        } catch (e) {
          console.warn('[api.request] clearAuth failed', e);
        }
        console.warn('[api.request] status 401 received - cleared stored auth. User must re-login.');
      }
      // Loguear el cuerpo completo (texto) para facilitar debug de validaciones
      try {
        if (suppress) console.debug('[api.request] response error', res.status, text);
        else console.warn('[api.request] response error', res.status, text);
      } catch (logErr) {
        if (suppress) console.debug('[api.request] response error (stringify failed) status', res.status);
        else console.warn('[api.request] response error (stringify failed) status', res.status);
      }
      throw { status: res.status, body: json, bodyText: text };
    }
    return json;
  } catch (e) {
    if (e && e.status) throw e;
    if (!res.ok) {
      try {
        if (options && options._suppressWarns) console.debug('[api.request] response error (non-json)', res.status, text);
        else console.warn('[api.request] response error (non-json)', res.status, text);
      } catch (logErr) {
        if (options && options._suppressWarns) console.debug('[api.request] response error (non-json) status', res.status);
        else console.warn('[api.request] response error (non-json) status', res.status);
      }
      throw { status: res.status, bodyText: text };
    }
    return text;
  }
}

export async function login(email, password) {
  const path = '/api/v1/auth/login';
  const formBody = new URLSearchParams({ username: email, password }).toString();
  console.log('[api.login] intentando', path);
  return await request(path, {
    method: 'POST',
    body: formBody,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// Social
export async function getPosts({ skip = 0, limit = 50 } = {}) {
  const q = `?skip=${Number(skip)}&limit=${Number(limit)}`;
  return await request(`/api/v1/publicaciones${q}`, { method: 'GET' });
}

// payload: { contenido: string, tipo: 'texto'|'imagen'|'documento'|'enlace'|'ruta_carpooling', media_urls?: string[] }
export async function createPost(payload = {}) {
  const body = JSON.stringify(payload);
  return await request('/api/v1/publicaciones', { method: 'POST', body });
}

// Upload files (expects files: array of { uri, name, type }) -> returns whatever the API returns
export async function uploadFiles(files = []) {
  // In React Native FormData + fetch handles file uploads when file objects have uri/name/type
  const form = new FormData();
  files.forEach((f) => {
    // each file should be { uri, name, type }
    form.append('files', {
      uri: f.uri,
      name: f.name || 'file',
      type: f.type || 'application/octet-stream',
    });
  });

  // Upload via FormData — request() will detect FormData and avoid forcing JSON Content-Type
  const res = await request('/api/v1/upload/files', { method: 'POST', body: form });
  // Normalize common shapes into array of URLs
  try {
    if (!res) return [];
    // If response is array of strings
    if (Array.isArray(res) && res.every(r => typeof r === 'string')) return res;
    // If response is array of objects with url/file_url/key
    if (Array.isArray(res)) {
      const urls = res.map(r => (typeof r === 'string' ? r : (r.url || r.file_url || r.key || r.path || null))).filter(Boolean);
      if (urls.length) return urls;
    }
    // If response is object containing array
    if (res.files && Array.isArray(res.files)) {
      const urls = res.files.map(r => (typeof r === 'string' ? r : (r.url || r.file_url || r.key || r.path || null))).filter(Boolean);
      if (urls.length) return urls;
    }
    if (res.data && Array.isArray(res.data)) {
      const urls = res.data.map(r => (typeof r === 'string' ? r : (r.url || r.file_url || r.key || r.path || null))).filter(Boolean);
      if (urls.length) return urls;
    }
    // If response is single object with url
    if (typeof res === 'object') {
      const maybe = res.url || res.file_url || res.key || res.path;
      if (maybe) return [maybe];
    }
  } catch (e) {
    // ignore normalization errors, return original res
    console.warn('[api.uploadFiles] normalization failed', e);
  }
  return res;
}

// Academia
export async function getSchedule(userId) {
  if (!userId) return [];
  const candidates = [
    `/api/v1/horarios/mi-horario`, // Endpoint correcto según README del backend
    `/api/v1/academia/${encodeURIComponent(userId)}/schedule`,
    `/api/v1/academia/schedule?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/schedule`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/academia`,
    `/api/v1/schedule?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/academia/${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/academia/schedule`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/horario`,
  ];
  let lastErr = null;
  for (const p of candidates) {
    try {
      console.debug('[api.getSchedule] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.schedule)) return res.schedule;
      if (res && Array.isArray(res.horario)) return res.horario;
      // If object contains nested arrays, pick the first array-looking prop
      if (res && typeof res === 'object') {
        for (const k of Object.keys(res)) {
          try {
            const val = res[k];
            if (Array.isArray(val)) return val;
          } catch (e) {}
        }
      }
      // Not an array, continue to next candidate
    } catch (e) {
      console.debug('[api.getSchedule] intento falló', p, e && e.status);
      lastErr = e;
    }
  }
  return [];
}

export async function getGrades(userId) {
  if (!userId) return [];
  const candidates = [
    `/api/v1/notas/mis-notas`, // Endpoint correcto según README del backend
    `/api/v1/academia/${encodeURIComponent(userId)}/grades`,
    `/api/v1/academia/grades?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/grades`,
    `/api/v1/grades?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/notas`,
    `/api/v1/notas?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/academia/${encodeURIComponent(userId)}/notas`,
  ];
  let lastErr = null;
  for (const p of candidates) {
    try {
      console.debug('[api.getGrades] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.grades)) return res.grades;
      if (res && Array.isArray(res.notas)) return res.notas;
      if (res && typeof res === 'object') {
        for (const k of Object.keys(res)) {
          try {
            const val = res[k];
            if (Array.isArray(val)) return val;
          } catch (e) {}
        }
      }
    } catch (e) {
      console.debug('[api.getGrades] intento falló', p, e && e.status);
      lastErr = e;
    }
  }
  return [];
}

// Carpooling
// Carpooling: try multiple common endpoints and normalize responses
export async function getCarpools() {
  const candidates = [
    '/api/v1/rutas-carpooling', // Endpoint correcto según README del backend
    '/api/v1/rutas-carpooling?limit=100',
    '/api/v1/carpooling',
    '/api/v1/carpools',
    '/api/v1/rutas',
    '/api/v1/rutas/carpooling',
  ];
  let lastErr = null;
  for (const p of candidates) {
    try {
      console.debug('[api.getCarpools] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.items)) return res.items;
      if (res && Array.isArray(res.carpoolings)) return res.carpoolings;
      if (res && Array.isArray(res.rutas)) return res.rutas;
      // find first array property
      for (const k of Object.keys(res || {})) {
        try {
          if (Array.isArray(res[k])) return res[k];
        } catch (e) {}
      }
      // if the response looks like an object representing a single carpool, return it as array
      if (res && typeof res === 'object' && (res.id || res.id_ruta || res.carpool_id)) return [res];
    } catch (e) {
      console.debug('[api.getCarpools] intento falló', p, e && e.status);
      lastErr = e;
    }
  }
  // If nothing matched, try to return a local sample to allow UI testing
  try {
    // eslint-disable-next-line global-require
    const sample = require('../mock/carpools_sample.json');
    if (Array.isArray(sample) && sample.length) {
      console.debug('[api.getCarpools] using local sample fallback');
      return sample;
    }
  } catch (e) {
    console.debug('[api.getCarpools] no local sample available', e);
  }
  // Fallback: return empty array
  return [];
}

export async function createCarpool(payload) {
  const candidates = [
    { method: 'POST', path: '/api/v1/rutas-carpooling', body: JSON.stringify(payload) }, // Endpoint correcto según README del backend
    { method: 'POST', path: '/api/v1/carpooling', body: JSON.stringify(payload) },
    { method: 'POST', path: '/api/v1/carpools', body: JSON.stringify(payload) },
    { method: 'POST', path: '/api/v1/rutas', body: JSON.stringify(payload) },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.createCarpool] intentando', a.path || a);
      // Do not suppress warns here so we get full debug output while diagnosing
      const res = await request(a.path, { method: a.method, body: a.body, headers: a.headers });
      return res;
    } catch (e) {
      // Log detailed error info for diagnosis
      try { console.warn('[api.createCarpool] intento falló', a.path, e && e.status, e && (e.bodyText || e.body)); } catch (xx) {}
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo crear la ruta de carpooling');
}

// Geocoding helpers
export async function reverseGeocode(lat, lon) {
  if (lat === undefined || lon === undefined) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RedSocial/1.0 (email@example.com)' } });
    const j = await res.json();
    if (!j) return null;
    return { display_name: j.display_name, address: j.address || null };
  } catch (e) {
    console.debug('[api.reverseGeocode] failed', e);
    return null;
  }
}

export async function searchPlaces(query, limit = 6) {
  if (!query) return [];
  try {
    const serpKey = (typeof process !== 'undefined' && process.env && process.env.SERPAPI_KEY) || null;
    if (serpKey) {
      const url = `https://serpapi.com/search.json?engine=google_maps_autocomplete&q=${encodeURIComponent(query)}&key=${encodeURIComponent(serpKey)}`;
      const res = await fetch(url);
      const j = await res.json();
      const candidates = (j && j.local_results && j.local_results.length) ? j.local_results.map(r => ({ id: r.place_id || r.position, name: r.title, latitude: r.latitude, longitude: r.longitude })) : [];
      return candidates;
    }
    // fallback: nominatim
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=${limit}`;
    const r2 = await fetch(nomUrl, { headers: { 'User-Agent': 'RedSocial/1.0 (email@example.com)' } });
    const j2 = await r2.json();
    return (Array.isArray(j2) ? j2 : []).map(p => ({ id: p.place_id || `${p.lat},${p.lon}`, name: p.display_name, latitude: Number(p.lat), longitude: Number(p.lon) }));
  } catch (e) {
    console.debug('[api.searchPlaces] failed', e);
    return [];
  }
}

// Use OpenRouteService (ORS) to compute route summary (distance, duration). Returns {distance, duration}
export async function getRouteSummary(origin, destination) {
  if (!origin || !destination) return null;
  try {
    if (!ORS_API_KEY) {
      console.debug('[api.getRouteSummary] ORS_API_KEY not set, skipping route summary');
      return null;
    }
    const coords = [ [origin.longitude || origin.lon || origin.lng, origin.latitude || origin.lat], [destination.longitude || destination.lon || destination.lng, destination.latitude || destination.lat] ];
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: coords }) });
    const body = await res.json();
    if (!res.ok) { console.debug('[api.getRouteSummary] ORS error', body); return null; }
    const props = body && body.features && body.features[0] && body.features[0].properties && body.features[0].properties.summary;
    if (!props) return null;
    return { distance: props.distance, duration: props.duration };
  } catch (e) {
    console.debug('[api.getRouteSummary] failed', e);
    return null;
  }
}

// Carpooling helpers: aplicaciones, postularse, cancelar, listar propias
export async function getCarpoolApplications(carpoolId) {
  if (!carpoolId) return [];
  const candidates = [
    `/api/v1/pasajeros/ruta/${encodeURIComponent(carpoolId)}`, // backend: GET /pasajeros/ruta/{id_ruta}
    `/api/v1/pasajeros?ruta_id=${encodeURIComponent(carpoolId)}`,
    `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/applications`,
    `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/applications/list`,
    `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/postulaciones`,
    `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/postulantes`,
    `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/applicants`,
  ];
  for (const p of candidates) {
    try {
      console.debug('[api.getCarpoolApplications] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.postulaciones)) return res.postulaciones;
      if (res && Array.isArray(res.applicants)) return res.applicants;
      // try nested
      for (const k of Object.keys(res || {})) {
        const val = res[k]; if (Array.isArray(val)) return val;
      }
    } catch (e) {
      console.debug('[api.getCarpoolApplications] intento falló', p, e && e.status);
    }
  }
  return [];
}

export async function applyToCarpool(carpoolId, seats = 1) {
  if (!carpoolId) throw new Error('carpoolId required');
  const candidates = [
    { method: 'POST', path: `/api/v1/pasajeros`, body: JSON.stringify({ id_ruta: carpoolId, seats }) }, // Endpoint correcto según README del backend
    { method: 'POST', path: `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/apply`, body: JSON.stringify({ seats }) },
    { method: 'POST', path: `/api/v1/carpooling/${encodeURIComponent(carpoolId)}/postular`, body: JSON.stringify({ seats }) },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.applyToCarpool] intentando', a.path);
      const res = await request(a.path, { method: a.method, body: a.body, _suppressWarns: true });
      return res;
    } catch (e) {
      console.debug('[api.applyToCarpool] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo postular a la ruta');
}

export async function cancelCarpoolApplication(carpoolIdOrApplicationId) {
  if (!carpoolIdOrApplicationId) throw new Error('id required');
  const candidates = [
    { method: 'POST', path: `/api/v1/carpooling/${encodeURIComponent(carpoolIdOrApplicationId)}/cancel` },
    { method: 'DELETE', path: `/api/v1/carpooling/applications/${encodeURIComponent(carpoolIdOrApplicationId)}` },
    { method: 'POST', path: `/api/v1/carpooling/${encodeURIComponent(carpoolIdOrApplicationId)}/postulacion/cancelar` },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.cancelCarpoolApplication] intentando', a.path);
      const res = await request(a.path, { method: a.method, _suppressWarns: true });
      return res;
    } catch (e) {
      console.debug('[api.cancelCarpoolApplication] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo cancelar la postulación');
}

export async function getMyCarpools(userId) {
  // List carpools created by a user
  const candidates = [
    `/api/v1/rutas-carpooling/mis-rutas`, // Endpoint correcto según README del backend
    `/api/v1/carpooling/mis_rutas`,
    `/api/v1/carpooling?owner_id=${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/carpooling`,
  ];
  for (const p of candidates) {
    try {
      console.debug('[api.getMyCarpools] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      for (const k of Object.keys(res || {})) { if (Array.isArray(res[k])) return res[k]; }
    } catch (e) {
      console.debug('[api.getMyCarpools] intento falló', p, e && e.status);
    }
  }
  return [];
}

export async function getMyApplications(userId) {
  const candidates = [
    `/api/v1/carpooling/applications?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/usuarios/${encodeURIComponent(userId)}/postulaciones`,
    `/api/v1/carpooling/mis_postulaciones`,
  ];
  for (const p of candidates) {
    try {
      console.debug('[api.getMyApplications] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      for (const k of Object.keys(res || {})) { if (Array.isArray(res[k])) return res[k]; }
    } catch (e) {
      console.debug('[api.getMyApplications] intento falló', p, e && e.status);
    }
  }
  return [];
}

export async function respondToApplication(applicationId, action = 'accept') {
  if (!applicationId) throw new Error('applicationId required');
  const act = action === 'accept' ? 'aceptado' : (action === 'rechazar' || action === 'reject' ? 'rechazado' : action);
  const candidates = [
    { method: 'PUT', path: `/api/v1/pasajeros/${encodeURIComponent(applicationId)}`, body: JSON.stringify({ estado: act }) }, // Endpoint correcto según README del backend
    { method: 'POST', path: `/api/v1/carpooling/applications/${encodeURIComponent(applicationId)}/${act}` },
    { method: 'PUT', path: `/api/v1/carpooling/applications/${encodeURIComponent(applicationId)}`, body: JSON.stringify({ estado: act }) },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.respondToApplication] intentando', a.path);
      const res = await request(a.path, { method: a.method, body: a.body, _suppressWarns: true });
      return res;
    } catch (e) {
      console.debug('[api.respondToApplication] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo responder la postulación');
}

// Messaging
export async function getChats() {
  // Endpoint correcto según README del backend
  return await request('/api/v1/mensajes/conversaciones', { method: 'GET' });
}

export async function getChatMessages(chatId) {
  // Endpoint correcto según README del backend
  return await request(`/api/v1/mensajes/conversacion/${chatId}`, { method: 'GET' });
}

export async function sendMessage(chatId, payload) {
  // Endpoint correcto según README del backend
  return await request('/api/v1/mensajes', { method: 'POST', body: JSON.stringify({ ...payload, id_conversacion: chatId, contenido: payload.text || payload.contenido }) });
}

export async function createConversation(participantes, tipo = 'privada', nombre = null) {
  // Crear nueva conversación (privada o grupal)
  return await request('/api/v1/mensajes/conversaciones', { 
    method: 'POST', 
    body: JSON.stringify({ participantes, tipo, nombre }) 
  });
}

export async function searchUsers(query) {
  // Buscar usuarios por nombre, apellido o correo
  return await request(`/api/v1/usuarios/search/query?q=${encodeURIComponent(query)}`, { method: 'GET' });
}

// Friends / Notifications / Profile
export async function getFriends() {
  // Endpoint correcto según README del backend
  console.log('[api.getFriends] obteniendo lista de amigos...');
  try {
    const lista = await request('/api/v1/amigos/lista', { method: 'GET' }).catch(err => {
      console.warn('[api.getFriends] /amigos/lista failed', err);
      return null;
    });

    if (Array.isArray(lista) && lista.length >= 0) {
      console.log('[api.getFriends] amigos encontrados:', lista.length);
      return lista;
    }

    // Fallback: usar solicitudes-recibidas + solicitudes-enviadas y filtrar aceptadas
    console.log('[api.getFriends] usando fallback: solicitudes aceptadas');
    const recibidas = await request('/api/v1/amigos/solicitudes-recibidas', { method: 'GET' }).catch(err => {
      console.warn('[api.getFriends] solicitudes-recibidas failed', err);
      return [];
    });
    const enviadas = await request('/api/v1/amigos/solicitudes-enviadas', { method: 'GET' }).catch(err => {
      console.warn('[api.getFriends] solicitudes-enviadas failed', err);
      return [];
    });

    // Filtrar solo las aceptadas y combinar
    const accepted = [];
    if (Array.isArray(recibidas)) {
      accepted.push(...recibidas.filter(r => r.estado === 'aceptado'));
    }
    if (Array.isArray(enviadas)) {
      accepted.push(...enviadas.filter(r => r.estado === 'aceptado'));
    }

    console.log('[api.getFriends] amigos aceptados (fallback):', accepted.length);
    return accepted;
  } catch (e) {
    console.warn('[api.getFriends] error general', e);
    return [];
  }
}

// Friend requests helpers
export async function getFriendRequestsReceived() {
  console.log('[api] getFriendRequestsReceived');
  return await request('/api/v1/amigos/solicitudes-recibidas', { method: 'GET' }).catch(err => {
    console.warn('[api] solicitudes-recibidas failed', err);
    throw err;
  });
}

export async function getFriendRequestsSent() {
  console.log('[api] getFriendRequestsSent');
  return await request('/api/v1/amigos/solicitudes-enviadas', { method: 'GET' }).catch(err => {
    console.warn('[api] solicitudes-enviadas failed', err);
    throw err;
  });
}

// Try to send a friend request. We attempt a couple of possible endpoints and return the first successful response.
export async function sendFriendRequest(payload = {}) {
  // payload could be { correo, username, id_usuario }
  const basePaths = ['/api/v1/amigos/solicitud', '/api/v1/amigos/solicitudes', '/api/v1/amigos'];
  const idKeys = ['id_usuario', 'id_usuario_destino', 'id_destino', 'id', 'usuario_id', 'id_usuario_receptor', 'id_destinatario'];
  // Algunos backends esperan el id en la query string (según logs: loc: ["query","id_usuario_destino"]) 
  const queryIdKeys = ['id_usuario_destino', 'id_destino', 'id_usuario', 'id'];
  const emailKeys = ['correo', 'email', 'email_destino', 'destinatario_email'];
  const usernameKeys = ['username', 'usuario', 'user'];

  const attempts = [];

  // If payload has id, generate attempts using different key names and JSON body
  if (payload.id_usuario || payload.id) {
    const idVal = payload.id_usuario || payload.id;
    // Primero intentar pasar el id como parámetro en la query (POST /.../solicitud?id_usuario_destino=...)
    for (const p of basePaths) {
      for (const qk of queryIdKeys) {
        attempts.push({ method: 'POST', path: `${p}?${encodeURIComponent(qk)}=${encodeURIComponent(idVal)}`, body: undefined });
      }
    }
    for (const p of basePaths) {
      for (const k of idKeys) {
        attempts.push({ method: 'POST', path: p, body: JSON.stringify({ [k]: idVal }) });
        // also try urlencoded
        attempts.push({ method: 'POST', path: p, body: new URLSearchParams({ [k]: idVal }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      }
    }
  }

  // If payload has email, try different keys
  if (payload.correo || payload.email) {
    const emailVal = payload.correo || payload.email;
    for (const p of basePaths) {
      for (const k of emailKeys) {
        attempts.push({ method: 'POST', path: p, body: JSON.stringify({ [k]: emailVal }) });
        attempts.push({ method: 'POST', path: p, body: new URLSearchParams({ [k]: emailVal }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      }
    }
  }

  // If payload has username
  if (payload.username) {
    for (const p of basePaths) {
      for (const k of usernameKeys) {
        attempts.push({ method: 'POST', path: p, body: JSON.stringify({ [k]: payload.username }) });
      }
    }
  }

  // As a fallback, send the raw payload as JSON to base paths
  for (const p of basePaths) {
    attempts.push({ method: 'POST', path: p, body: JSON.stringify(payload) });
  }

  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.sendFriendRequest] intentando', a.path, 'body:', a.body);
      return await request(a.path, { method: a.method, body: a.body, headers: a.headers });
    } catch (e) {
      console.warn('[api.sendFriendRequest] intento falló', a.path, e && (e.status || ''), (e && (e.bodyText || (e.body ? JSON.stringify(e.body) : null))) || e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo enviar la solicitud');
}

// Respond to a friend request (accept/reject). Accept action: 'aceptar' or 'rechazar'
export async function respondFriendRequest(requestId, action = 'aceptar') {
  const attempts = [
    { method: 'PUT', path: `/api/v1/amigos/solicitud/${requestId}?accion=${action}`, body: undefined }, // Endpoint correcto según README del backend
    { method: 'PUT', path: `/api/v1/amigos/solicitud/${requestId}`, body: JSON.stringify({ accion: action }) },
    { method: 'POST', path: `/api/v1/amigos/solicitudes/${requestId}/${action}` },
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.respondFriendRequest] intentando', a.path);
      return await request(a.path, { method: a.method, body: a.body });
    } catch (e) {
      console.warn('[api.respondFriendRequest] intento falló', a.path, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo responder la solicitud');
}

// Remove friend / cancel request
export async function removeFriendOrCancel(requestOrFriendId) {
  const attempts = [
    { method: 'DELETE', path: `/api/v1/amigos/eliminar/${requestOrFriendId}` }, // Endpoint correcto según README del backend
    { method: 'DELETE', path: `/api/v1/amigos/${requestOrFriendId}` },
    { method: 'POST', path: `/api/v1/amigos/${requestOrFriendId}/eliminar` },
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.removeFriendOrCancel] intentando', a.path);
      return await request(a.path, { method: a.method });
    } catch (e) {
      console.warn('[api.removeFriendOrCancel] intento falló', a.path, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo eliminar la relación');
}

export async function getNotifications() {
  return await request('/api/v1/notificaciones', { method: 'GET' });
}

export async function markNotificationAsRead(notificationId) {
  return await request(`/api/v1/notificaciones/${notificationId}/leer`, { method: 'PUT' });
}

export async function markAllNotificationsAsRead() {
  return await request('/api/v1/notificaciones/marcar-todas-leidas', { method: 'PUT' });
}

export async function getUnreadNotificationsCount() {
  return await request('/api/v1/notificaciones/no-leidas', { method: 'GET' });
}

export async function getProfile(userId) {
  return await request(`/api/v1/usuarios/${userId}`, { method: 'GET' });
}

// Reactions: add/remove reaction to a post. Try several common endpoint shapes.
export async function addReaction(postId, tipo = 'like') {
  if (!postId) throw new Error('postId required');
  // If we discovered a working reaction path previously, try it first to avoid WARNs
  if (!global.__lastSuccessfulReactionPath) global.__lastSuccessfulReactionPath = null;
  // Try to hydrate from AsyncStorage if available
  if (!global.__lastSuccessfulReactionPath) {
    try {
      const stored = await AsyncStorage.getItem('lastReactionPath');
      if (stored) global.__lastSuccessfulReactionPath = stored;
    } catch (e) {
      // ignore
    }
  }

  const attempts = [];
  if (global.__lastSuccessfulReactionPath) {
    attempts.push({ method: 'POST', path: global.__lastSuccessfulReactionPath, body: JSON.stringify({ id_publicacion: postId, tipo_reac: tipo }), headers: { 'Content-Type': 'application/json' } });
  }

  // Candidate attempts (will try in order)
  attempts.push(
    { method: 'POST', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/reaccion`, body: JSON.stringify({ tipo }) },
    { method: 'POST', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/reacciones`, body: JSON.stringify({ tipo }) },
    // Try common body shapes for /api/v1/reacciones (server may expect tipo_reac)
    { method: 'POST', path: '/api/v1/reacciones', body: JSON.stringify({ id_publicacion: postId, tipo_reac: tipo }) },
    { method: 'POST', path: '/api/v1/reacciones', body: JSON.stringify({ id_publicacion: postId, tipo_reaccion: tipo }) },
    { method: 'POST', path: '/api/v1/reacciones', body: JSON.stringify({ id_publicacion: postId, tipoReaccion: tipo }) },
    { method: 'POST', path: '/api/v1/reacciones', body: JSON.stringify({ publicacion_id: postId, tipo_reac: tipo }) },
    // urlencoded variants
    { method: 'POST', path: '/api/v1/reacciones', body: new URLSearchParams({ id_publicacion: postId, tipo_reac: tipo }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    { method: 'POST', path: '/api/v1/reacciones', body: new URLSearchParams({ id_publicacion: postId, tipo_reaccion: tipo }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    // fallback: query param variant on publicaciones
    { method: 'POST', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/reaccion?tipo=${encodeURIComponent(tipo)}`, body: undefined },
  );
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.addReaction] intentando', a.path, a.body ? a.body : 'no-body');
      const res = await request(a.path, { method: a.method, body: a.body, headers: a.headers, _suppressWarns: true });
      console.log('[api.addReaction] intento exitoso', a.path, res);
      // Cache the successful reaction path to avoid repeated probing attempts
      try {
        global.__lastSuccessfulReactionPath = a.path;
        await AsyncStorage.setItem('lastReactionPath', a.path).catch(() => {});
      } catch (e) {
        // ignore if global not writable
      }
      return res;
    } catch (e) {
      console.debug('[api.addReaction] intento falló', a.path, e && e.status, e && (e.bodyText || e.body));
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo añadir la reacción');
}

// Try to fetch the entire comments table (all comments). Useful when backend
// exposes a single `/comentarios` resource and the client should filter by post.
export async function getAllComments() {
  const candidates = [
    '/api/v1/comentarios',
    '/api/v1/comments',
    '/comentarios',
    '/comments',
  ];
  let lastErr = null;
  for (const p of candidates) {
    try {
      console.debug('[api.getAllComments] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.comentarios)) return res.comentarios;
      if (res && Array.isArray(res.comments)) return res.comments;
      // If we received an object that contains arrays, try to find one
      for (const k of Object.keys(res)) {
        try {
          const val = res[k];
          if (Array.isArray(val)) return val;
        } catch (e) {
          // ignore
        }
      }
      // No array found, continue to next candidate
    } catch (e) {
      console.debug('[api.getAllComments] intento falló', p, e);
      lastErr = e;
    }
  }
  // If none returned an array, throw the last error or return empty
  if (lastErr) {
    // don't surface noisy errors for probes; return empty to let caller fallback
    return [];
  }
  return [];
}

// Comments: list and add comments for a post. Try several common shapes.
export async function getComments(postId) {
  if (!postId) return [];
  // Primero intentar obtener la lista completa de comentarios y filtrar en cliente.
  // Esto evita tener que probar múltiples endpoints por-publicacion y facilita
  // trabajar con backends que solo exponen una tabla /api/v1/comentarios.
  try {
    const all = await getAllComments();
    if (Array.isArray(all) && all.length > 0) {
      const filtered = all.filter(c => String(c.id_publicacion || c.publicacion_id || c.post_id || c.id_post || c.publicacion) === String(postId));
      return filtered;
    }
  } catch (e) {
    console.debug('[api.getComments] getAllComments failed', e);
  }

  const attempts = [
    { method: 'GET', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/comentarios` },
    { method: 'GET', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/comments` },
    { method: 'GET', path: `/api/v1/comentarios/${encodeURIComponent(postId)}` },
    { method: 'GET', path: `/api/v1/comentarios?publicacion_id=${encodeURIComponent(postId)}` },
    { method: 'GET', path: `/api/v1/comentarios?post_id=${encodeURIComponent(postId)}` },
    { method: 'GET', path: `/api/v1/comentarios?publicacion=${encodeURIComponent(postId)}` },
    // Try fetching the post resource itself; some backends embed comments there
    { method: 'GET', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}` },
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.debug('[api.getComments] intentando', a.path);
      const res = await request(a.path, { method: a.method, _suppressWarns: true });
      // Normalize several response shapes into an array of comments
      if (Array.isArray(res) && res.length > 0) return res.filter(Boolean);
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.comentarios)) return res.comentarios;
      if (res && Array.isArray(res.comments)) return res.comments;

      // If we got an object (e.g. the post resource), try to find embedded arrays of comments recursively
      const findCommentsInObject = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 6) return null;
        // If obj itself looks like a comment array
        if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
          const sample = obj[0];
          const keys = Object.keys(sample || {});
          const hasCommentLike = keys.some(k => ['contenido','comentario','texto','id_comentario','id_user','usuario','fecha_creacion'].includes(k));
          if (hasCommentLike) return obj;
        }
        // Search properties
        for (const k of Object.keys(obj)) {
          try {
            const val = obj[k];
            if (Array.isArray(val)) {
              const found = findCommentsInObject(val, depth + 1);
              if (found) return found;
            } else if (val && typeof val === 'object') {
              const found = findCommentsInObject(val, depth + 1);
              if (found) return found;
            }
          } catch (e) {
            // ignore
          }
        }
        return null;
      };

      if (res && typeof res === 'object') {
        const found = findCommentsInObject(res);
        if (found && Array.isArray(found)) return found;
      }

      // If this is a generic comentarios list (all comments), filter by postId
      if (Array.isArray(res) && res.length > 0) {
        return res.filter(c => String(c.id_publicacion || c.publicacion_id || c.post_id || c.id_post || c.publicacion) === String(postId));
      }
      return [];
    } catch (e) {
      console.debug('[api.getComments] intento falló', a.path, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudieron obtener los comentarios');
}

export async function addComment(postId, contenido = '') {
  if (!postId) throw new Error('postId required');
  // Include authenticated user id when possible (backend expects id_user)
  let auth = null;
  try { auth = await loadAuth(); } catch (e) { auth = null; }
  const uid = auth && ( (auth.user && (auth.user.id || auth.user.id_user || auth.user._id || auth.user.id_usuario)) || auth.id || auth.user_id );

  const attempts = [];
  const pushBody = (bodyObj) => {
    attempts.push({ method: 'POST', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/comentarios`, body: JSON.stringify(bodyObj) });
    attempts.push({ method: 'POST', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/comments`, body: JSON.stringify(bodyObj) });
    attempts.push({ method: 'POST', path: `/api/v1/comentarios`, body: JSON.stringify(bodyObj) });
  };

  // common shapes
  pushBody({ id_publicacion: postId, contenido });
  if (uid) pushBody({ id_publicacion: postId, id_user: uid, contenido });
  pushBody({ publicacion_id: postId, contenido });
  if (uid) pushBody({ publicacion_id: postId, id_user: uid, contenido });
  pushBody({ id_publicacion: postId, comentario: contenido });
  if (uid) pushBody({ id_publicacion: postId, id_user: uid, comentario: contenido });

  // urlencoded fallback
  attempts.push({ method: 'POST', path: '/api/v1/comentarios', body: new URLSearchParams(Object.assign({ id_publicacion: postId, contenido }, uid ? { id_user: uid } : {})).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.addComment] intentando', a.path, a.body ? a.body : 'no-body');
      const res = await request(a.path, { method: a.method, body: a.body, headers: a.headers, _suppressWarns: true });
      console.log('[api.addComment] intento exitoso', a.path, res);
      return res;
    } catch (e) {
      console.debug('[api.addComment] intento falló', a.path, e && e.status, e && (e.bodyText || e.body));
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo añadir el comentario');
}

// Events (Eventos): list, create, join, leave, my events
export async function getEvents({ skip = 0, limit = 50 } = {}) {
  const q = `?skip=${Number(skip)}&limit=${Number(limit)}`;
  const candidates = [
    `/api/v1/events${q}`,
    `/api/v1/eventos${q}`,
    `/api/v1/eventos`,
    `/api/v1/events`,
    `/api/v1/eventos?limit=${Number(limit)}&skip=${Number(skip)}`,
  ];
  for (const p of candidates) {
    try {
      console.debug('[api.getEvents] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.eventos)) return res.eventos;
      if (res && Array.isArray(res.events)) return res.events;
      // try to grab first array property
      for (const k of Object.keys(res || {})) if (Array.isArray(res[k])) return res[k];
    } catch (e) {
      console.debug('[api.getEvents] intento falló', p, e && e.status);
    }
  }
  return [];
}

export async function createEvent(payload = {}) {
  const candidates = [
    { method: 'POST', path: '/api/v1/eventos', body: JSON.stringify(payload) },
    { method: 'POST', path: '/api/v1/events', body: JSON.stringify(payload) },
    { method: 'POST', path: '/api/v1/eventos/create', body: JSON.stringify(payload) },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.createEvent] intentando', a.path);
      const res = await request(a.path, { method: a.method, body: a.body });
      return res;
    } catch (e) {
      console.debug('[api.createEvent] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo crear el evento');
}

export async function joinEvent(eventId) {
  if (!eventId) throw new Error('eventId required');
  const candidates = [
    { method: 'POST', path: `/api/v1/eventos/${encodeURIComponent(eventId)}/join` },
    { method: 'POST', path: `/api/v1/events/${encodeURIComponent(eventId)}/join` },
    { method: 'POST', path: `/api/v1/eventos/join`, body: JSON.stringify({ event_id: eventId }) },
    { method: 'POST', path: `/api/v1/events/join`, body: JSON.stringify({ event_id: eventId }) },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.joinEvent] intentando', a.path);
      const res = await request(a.path, { method: a.method, body: a.body, _suppressWarns: true });
      return res;
    } catch (e) {
      console.debug('[api.joinEvent] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo unir al evento');
}

export async function leaveEvent(eventId) {
  if (!eventId) throw new Error('eventId required');
  const candidates = [
    { method: 'POST', path: `/api/v1/eventos/${encodeURIComponent(eventId)}/leave` },
    { method: 'POST', path: `/api/v1/events/${encodeURIComponent(eventId)}/leave` },
    { method: 'DELETE', path: `/api/v1/eventos/${encodeURIComponent(eventId)}/join` },
    { method: 'DELETE', path: `/api/v1/events/${encodeURIComponent(eventId)}/join` },
  ];
  let lastErr = null;
  for (const a of candidates) {
    try {
      console.log('[api.leaveEvent] intentando', a.path);
      const res = await request(a.path, { method: a.method, _suppressWarns: true });
      return res;
    } catch (e) {
      console.debug('[api.leaveEvent] intento falló', a.path, e && e.status);
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo salir del evento');
}

export async function getMyEvents(userId) {
  if (!userId) return [];
  const candidates = [
    `/api/v1/usuarios/${encodeURIComponent(userId)}/eventos`,
    `/api/v1/eventos?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/events?user_id=${encodeURIComponent(userId)}`,
    `/api/v1/eventos/mis_eventos`,
  ];
  for (const p of candidates) {
    try {
      console.debug('[api.getMyEvents] intentando', p);
      const res = await request(p, { method: 'GET', _suppressWarns: true });
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.eventos)) return res.eventos;
      for (const k of Object.keys(res || {})) if (Array.isArray(res[k])) return res[k];
    } catch (e) {
      console.debug('[api.getMyEvents] intento falló', p, e && e.status);
    }
  }
  return [];
}

export async function removeReaction(postId, tipo = null) {
  if (!postId) throw new Error('postId required');
  const attempts = [
    { method: 'DELETE', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/reaccion` },
    { method: 'DELETE', path: `/api/v1/publicaciones/${encodeURIComponent(postId)}/reacciones` },
    { method: 'DELETE', path: `/api/v1/reacciones/${encodeURIComponent(postId)}` },
    // try remover endpoint with expected field names
    { method: 'POST', path: `/api/v1/reacciones/remover`, body: JSON.stringify({ id_publicacion: postId, tipo_reac: tipo }) },
    { method: 'POST', path: `/api/v1/reacciones/remover`, body: JSON.stringify({ id_publicacion: postId, tipo_reaccion: tipo }) },
    { method: 'POST', path: `/api/v1/reacciones/remover`, body: new URLSearchParams({ id_publicacion: postId, tipo_reac: tipo }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log('[api.removeReaction] intentando', a.path);
      const res = await request(a.path, { method: a.method, body: a.body, headers: a.headers, _suppressWarns: true });
      console.log('[api.removeReaction] intento exitoso', a.path, res);
      return res;
    } catch (e) {
      console.debug('[api.removeReaction] intento falló', a.path, e && e.status, e && (e.bodyText || e.body));
      lastErr = e;
    }
  }
  throw lastErr || new Error('No se pudo eliminar la reacción');
}

export default {
  login,
  getPosts,
  createPost,
  uploadFiles,
  getSchedule,
  getGrades,
  getCarpools,
  createCarpool,
  getCarpoolApplications,
  applyToCarpool,
  cancelCarpoolApplication,
  getMyCarpools,
  getMyApplications,
  respondToApplication,
  getChats,
  getChatMessages,
  sendMessage,
  createConversation,
  searchUsers,
  getFriends,
  getFriendRequestsReceived,
  getFriendRequestsSent,
  sendFriendRequest,
  respondFriendRequest,
  removeFriendOrCancel,
  addReaction,
  getEvents,
  createEvent,
  joinEvent,
  leaveEvent,
  getMyEvents,
  searchPlaces,
  reverseGeocode,
  getRouteSummary,
  getComments,
  addComment,
  removeReaction,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  getProfile,
};
