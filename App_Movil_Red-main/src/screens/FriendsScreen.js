import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import api from '../lib/api';

const TABS = ['Amigos', 'Recibidas', 'Enviadas'];

function getDisplayNameFromRel(rel) {
  // rel puede ser una relación con usuario1/usuario2 o un objeto usuario
  if (!rel) return 'Desconocido';
  const u1 = rel.usuario1 || rel.usuario_1 || rel.usuario1_id || null;
  const u2 = rel.usuario2 || rel.usuario_2 || rel.usuario2_id || null;
  const pick = typeof u1 === 'object' ? u1 : (typeof u2 === 'object' ? u2 : null);
  if (pick) return pick.nombre || pick.name || pick.username || pick.email || String(pick.id || pick.id_user || 'Usuario');
  return rel.name || rel.username || rel.email || rel.id || 'Usuario';
}

function getIdFromRel(rel, preferOtherUser = false, myUserId = null) {
  // intenta extraer id de relación o del usuario objetivo
  if (!rel) return null;
  if (rel.id || rel.id_relacion) return rel.id || rel.id_relacion;
  const u1 = rel.usuario1 || rel.usuario_1 || rel.usuario1_id || null;
  const u2 = rel.usuario2 || rel.usuario_2 || rel.usuario2_id || null;
  const id1 = u1 && (u1.id || u1.id_user || u1.usuario_id);
  const id2 = u2 && (u2.id || u2.id_user || u2.usuario_id);
  if (preferOtherUser && myUserId) {
    if (id1 && String(id1) !== String(myUserId)) return id1;
    if (id2 && String(id2) !== String(myUserId)) return id2;
  }
  return id1 || id2 || null;
}

export default function FriendsScreen() {
  const [tab, setTab] = useState('Amigos');
  const [friends, setFriends] = useState([]);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Normalizar distintas formas de respuesta a un objeto consistente
  function normalizeRel(rel) {
    if (!rel) return { id: null, displayName: 'Desconocido', email: null, username: null, raw: rel };
    if (rel.displayName && (rel.id || rel.email || rel.username)) return { id: rel.id || null, displayName: rel.displayName, email: rel.email || null, username: rel.username || null, raw: rel };
    // Buscar objeto usuario anidado
    const candidates = [];
    ['usuario', 'usuario1', 'usuario2', 'usuario_1', 'usuario_2', 'user'].forEach(k => { if (rel[k]) candidates.push(rel[k]); });
    Object.keys(rel).forEach(k => { const v = rel[k]; if (v && typeof v === 'object' && (v.email || v.correo || v.nombre || v.username || v.id)) candidates.push(v); });
    if (rel.email || rel.correo || rel.nombre || rel.username || rel.id) candidates.unshift(rel);
    const pick = candidates.length > 0 ? candidates[0] : null;
    const id = pick && (pick.id || pick.id_user || pick.usuario_id) ? (pick.id || pick.id_user || pick.usuario_id) : (rel.id || rel.id_relacion || null);
    const name = pick ? (pick.nombre || pick.name || pick.username || pick.email) : (rel.name || rel.username || rel.email || null);
    const email = pick ? (pick.email || pick.correo || null) : (rel.email || rel.correo || null);
    const username = pick ? (pick.username || null) : null;
    return { id: id || null, displayName: name || 'Usuario', email: email || null, username: username || null, raw: rel };
  }

  const loadAll = async () => {
    setLoading(true);
    try {
      const f = await api.getFriends().catch(e => { console.warn('[FriendsScreen] getFriends failed', e); return []; });
      const normF = Array.isArray(f) ? f.map(normalizeRel) : [];
      setFriends(normF);
      const r = await api.getFriendRequestsReceived().catch(e => { console.warn('[FriendsScreen] recibidas failed', e); return []; });
      const normR = Array.isArray(r) ? r.map(normalizeRel) : [];
      setRecibidas(normR);
      const s = await api.getFriendRequestsSent().catch(e => { console.warn('[FriendsScreen] enviadas failed', e); return []; });
      const normS = Array.isArray(s) ? s.map(normalizeRel) : [];
      setEnviadas(normS);
    } catch (e) {
      console.warn('[FriendsScreen] loadAll error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const onAccept = async (item) => {
    const id = getIdFromRel(item) || item.id || item.id_solicitud || item.id_request;
    Alert.alert('Aceptar solicitud', '¿Confirmar aceptar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aceptar', onPress: async () => {
          try {
            await api.respondFriendRequest(id, 'aceptar');
            Alert.alert('Listo', 'Solicitud aceptada');
            await loadAll();
          } catch (e) {
            console.warn('[FriendsScreen] accept failed', e);
            Alert.alert('Error', 'No se pudo aceptar la solicitud. Revisa logs.');
          }
        }}
    ]);
  };

  const onReject = async (item) => {
    const id = getIdFromRel(item) || item.id || item.id_solicitud || item.id_request;
    Alert.alert('Rechazar solicitud', '¿Confirmar rechazar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
          try {
            await api.respondFriendRequest(id, 'rechazar');
            Alert.alert('Listo', 'Solicitud rechazada');
            await loadAll();
          } catch (e) {
            console.warn('[FriendsScreen] reject failed', e);
            Alert.alert('Error', 'No se pudo rechazar la solicitud. Revisa logs.');
          }
        }}
    ]);
  };

  const onRemove = async (item) => {
    const id = getIdFromRel(item) || item.id || item.id_relacion || item.id_usuario || item.id_user;
    Alert.alert('Eliminar amigo', '¿Confirmar eliminar relación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.removeFriendOrCancel(id);
            Alert.alert('Listo', 'Relación eliminada');
            await loadAll();
          } catch (e) {
            console.warn('[FriendsScreen] remove failed', e);
            Alert.alert('Error', 'No se pudo eliminar. Revisa logs.');
          }
        }}
    ]);
  };

  const onSend = async () => {
    if ((!query || query.trim().length === 0) && !selectedSuggestion) return Alert.alert('Aviso', 'Ingresa correo o username');
    try {
      // Si el usuario seleccionó una sugerencia, priorizamos enviar por id/email
      if (selectedSuggestion && selectedSuggestion.id) {
        await api.sendFriendRequest({ id_usuario: selectedSuggestion.id });
      } else if (selectedSuggestion && selectedSuggestion.email) {
        await api.sendFriendRequest({ correo: selectedSuggestion.email });
      } else {
        await api.sendFriendRequest({ query: query.trim(), correo: query.trim(), username: query.trim() });
      }
      Alert.alert('Listo', 'Solicitud enviada (si el backend la aceptó)');
      setShowAddModal(false);
      setQuery('');
      setSelectedSuggestion(null);
      await loadAll();
    } catch (e) {
      console.warn('[FriendsScreen] send failed', e);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Revisa logs.');
    }
  };

  // Buscar sugerencias mientras el usuario escribe (debounce)
  useEffect(() => {
    let mounted = true;
    let t = null;
    if (!showAddModal) return;
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    t = setTimeout(async () => {
      try {
        // Intentar buscar en backend
        const remote = await api.searchUsers(query.trim()).catch(e => {
          console.warn('[FriendsScreen] searchUsers failed', e);
          return null;
        });
        // scoring helper: 3 = startsWith, 2 = includes, 1 = subsequence, 0 = no match
        const scoreMatch = (text, q) => {
          if (!text || !q) return 0;
          const t = text.toLowerCase();
          const s = q.toLowerCase();
          if (t.startsWith(s)) return 3;
          if (t.includes(s)) return 2;
          // subsequence: todas las letras de s aparecen en t en orden (no necesariamente contiguas)
          let i = 0;
          for (let j = 0; j < t.length && i < s.length; j++) {
            if (t[j] === s[i]) i++;
          }
          if (i === s.length) return 1;
          return 0;
        };

        const q = query.trim().toLowerCase();
        if (remote && Array.isArray(remote) && mounted) {
          // Normalizar resultados remotos antes de filtrarlos y puntuarlos
          const normalized = remote.slice(0, 200).map(normalizeRel);
          const withScore = normalized.map(r => {
            const name = (r.displayName || '').toLowerCase();
            const email = (r.email || '').toLowerCase();
            const score = Math.max(scoreMatch(name, q), scoreMatch(email, q));
            return { r, score };
          }).filter(x => x.score > 0);
          withScore.sort((a, b) => b.score - a.score);
          const top = withScore.slice(0, 10).map(x => x.r);
          setSuggestions(top);
          setSearching(false);
          return;
        }

        // Fallback: filtrar localmente friends/recibidas/enviadas con scoring
        const all = [];
        (friends || []).forEach(r => all.push(r));
        (recibidas || []).forEach(r => all.push(r));
        (enviadas || []).forEach(r => all.push(r));
        const localNorm = all.map(normalizeRel);
        const scored = localNorm.map(r => {
          const name = (r.displayName || '').toLowerCase();
          const email = (r.email || '').toLowerCase();
          const score = Math.max(scoreMatch(name, q), scoreMatch(email, q));
          return { r, score };
        }).filter(x => x.score > 0);
        scored.sort((a, b) => b.score - a.score);
        const localMatches = scored.slice(0, 10).map(x => x.r);
        if (mounted) setSuggestions(localMatches);
      } catch (e) {
        console.warn('[FriendsScreen] suggestion error', e);
      } finally {
        if (mounted) setSearching(false);
      }
    }, 250);
    return () => { mounted = false; clearTimeout(t); };
  }, [query, showAddModal]);

  const renderItem = ({ item }) => {
    const name = getDisplayNameFromRel(item);
    const secondary = item.email || item.username || (item.raw && (item.raw.email || item.raw.correo || item.raw.username)) || '';
    return (
      <View style={styles.request}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600' }}>{name}</Text>
          {secondary ? <Text style={{ color: '#666', fontSize: 12 }}>{secondary}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {tab === 'Recibidas' && (
            <>
              <Button title="Aceptar" onPress={() => onAccept(item)} />
              <View style={{ width: 8 }} />
              <Button title="Rechazar" onPress={() => onReject(item)} />
            </>
          )}
          {tab === 'Enviadas' && (
            <Button title="Cancelar" onPress={() => onRemove(item)} />
          )}
          {tab === 'Amigos' && (
            <Button title="Eliminar" onPress={() => onRemove(item)} />
          )}
        </View>
      </View>
    );
  };

  const dataForTab = tab === 'Amigos' ? friends : (tab === 'Recibidas' ? recibidas : enviadas);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amigos</Text>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t ? styles.tabActive : null]}>
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <Button title="Buscar / Agregar" onPress={() => setShowAddModal(true)} />
      </View>

      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={dataForTab}
          keyExtractor={(i, idx) => String(i.id || i.id_publicacion || i.id_solicitud || i.id_relacion || idx)}
          renderItem={renderItem}
          ListEmptyComponent={<View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#666' }}>{tab === 'Amigos' ? 'No tienes amigos aún.' : (tab === 'Recibidas' ? 'No hay solicitudes recibidas.' : 'No has enviado solicitudes.')}</Text></View>}
        />
      )}

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Enviar solicitud</Text>
            <TextInput placeholder="Correo o username" value={query} onChangeText={setQuery} style={styles.input} />
            {searching ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
            {suggestions && suggestions.length > 0 && (
              <View style={{ maxHeight: 200, marginTop: 8 }}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(i, idx) => String(i.id || i.email || i.username || idx)}
                  renderItem={({item}) => (
                    <TouchableOpacity onPress={() => { setQuery(item.displayName); setSuggestions([]); setSelectedSuggestion(item); }} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: '600' }}>{item.displayName}</Text>
                      {item.email ? <Text style={{ color: '#666', fontSize: 12 }}>{item.email}</Text> : null}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Button title="Cancelar" onPress={() => { setShowAddModal(false); setQuery(''); setSuggestions([]); }} />
              <View style={{ width: 12 }} />
              <Button title="Enviar" onPress={onSend} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  request: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 8, backgroundColor: '#f2f2f2' },
  tabActive: { backgroundColor: '#007bff' },
  tabText: { color: '#333' },
  tabTextActive: { color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 }
});
