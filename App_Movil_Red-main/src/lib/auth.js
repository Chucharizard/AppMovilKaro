let AsyncStorage;
try {
  // require dinámico para evitar error si el paquete nativo no está instalado
  // (por ejemplo durante pruebas rápidas con Expo Go sin rebuild).
  // eslint-disable-next-line global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null;
}

const AUTH_KEY = 'rs_auth_v1';

// Fallback en memoria cuando AsyncStorage no está disponible
const memoryStore = {};
const memAsync = {
  async setItem(key, value) { memoryStore[key] = value; },
  async getItem(key) { return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null; },
  async removeItem(key) { delete memoryStore[key]; },
};

const storage = AsyncStorage || memAsync;

export async function saveAuth(tokenResponse) {
  try {
    await storage.setItem(AUTH_KEY, JSON.stringify(tokenResponse));
  } catch (e) {
    console.warn('[auth] fallo al guardar auth', e);
  }
}

export async function loadAuth() {
  try {
    const txt = await storage.getItem(AUTH_KEY);
    return txt ? JSON.parse(txt) : null;
  } catch (e) {
    console.warn('[auth] fallo al cargar auth', e);
    return null;
  }
}

export async function clearAuth() {
  try {
    await storage.removeItem(AUTH_KEY);
  } catch (e) {
    console.warn('[auth] fallo al limpiar auth', e);
  }
}

export default { saveAuth, loadAuth, clearAuth };
