import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl } from 'react-native';
import api from '../lib/api';
import { Button, Card, Avatar } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

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
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
      flexDirection: 'row',
    },
    tabActive: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textLight,
    },
    tabTextActive: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    badge: {
      marginLeft: 6,
      backgroundColor: theme.colors.accent,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeSent: {
      marginLeft: 6,
      backgroundColor: theme.colors.warning,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeFriends: {
      marginLeft: 6,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    avatar: {
      marginRight: theme.spacing.md,
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    friendEmail: {
      fontSize: 13,
      color: theme.colors.textLight,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      backgroundColor: theme.colors.secondary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    acceptButtonText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '700',
    },
    rejectButton: {
      backgroundColor: theme.colors.accent,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    rejectButtonText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '700',
    },
    removeButton: {
      backgroundColor: theme.colors.error,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    removeButtonText: {
      fontSize: 18,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      width: '90%',
      maxHeight: '80%',
      ...theme.shadows.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.textLight,
      padding: 4,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      margin: theme.spacing.lg,
      fontSize: 15,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    suggestionsContainer: {
      maxHeight: 300,
      paddingHorizontal: theme.spacing.lg,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    suggestionItemSelected: {
      backgroundColor: theme.colors.primaryLight,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    suggestionInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    suggestionName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    suggestionEmail: {
      fontSize: 13,
      color: theme.colors.textLight,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  }), [theme]);
  
  const [tab, setTab] = useState('Amigos');
  const [friends, setFriends] = useState([]);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

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
      <View style={styles.friendCard}>
        <Avatar 
          name={name}
          size={56}
          style={styles.avatar}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{name}</Text>
          {secondary ? <Text style={styles.friendEmail}>{secondary}</Text> : null}
        </View>
        <View style={styles.actionButtons}>
          {tab === 'Recibidas' && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(item)}>
                <Text style={styles.acceptButtonText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(item)}>
                <Text style={styles.rejectButtonText}>✕</Text>
              </TouchableOpacity>
            </>
          )}
          {tab === 'Enviadas' && (
            <Button variant="outline" size="sm" onPress={() => onRemove(item)}>
              Cancelar
            </Button>
          )}
          {tab === 'Amigos' && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(item)}>
              <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const dataForTab = tab === 'Amigos' ? friends : (tab === 'Recibidas' ? recibidas : enviadas);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Amigos</Text>
        <Button variant="primary" size="sm" onPress={() => setShowAddModal(true)}>
          + Agregar
        </Button>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setTab(t)} 
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {/* Badge con contador */}
            {t === 'Recibidas' && recibidas.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{recibidas.length}</Text>
              </View>
            )}
            {t === 'Enviadas' && enviadas.length > 0 && (
              <View style={styles.badgeSent}>
                <Text style={styles.badgeText}>{enviadas.length}</Text>
              </View>
            )}
            {t === 'Amigos' && friends.length > 0 && (
              <View style={styles.badgeFriends}>
                <Text style={styles.badgeText}>{friends.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={dataForTab}
          keyExtractor={(i, idx) => String(i.id || i.id_publicacion || i.id_solicitud || i.id_relacion || idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {tab === 'Amigos' ? '👥' : tab === 'Recibidas' ? '📬' : '📤'}
              </Text>
              <Text style={styles.emptyText}>
                {tab === 'Amigos' ? 'No tienes amigos aún' : 
                 tab === 'Recibidas' ? 'No hay solicitudes recibidas' : 
                 'No has enviado solicitudes'}
              </Text>
              <Text style={styles.emptySubtext}>
                {tab === 'Amigos' ? 'Agrega amigos para empezar a conectar' : 
                 tab === 'Recibidas' ? 'Las solicitudes aparecerán aquí' : 
                 'Busca usuarios y envía solicitudes'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal para agregar amigos */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar Amigos</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setQuery(''); setSuggestions([]); setSelectedSuggestion(null); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Buscar por nombre, correo o username..."
              placeholderTextColor={theme.colors.textLight}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoFocus
            />

            {searching && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 12 }} />
            )}

            {/* Resultados de búsqueda */}
            {suggestions && suggestions.length > 0 && (
              <ScrollView style={styles.suggestionsContainer}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => { 
                      setSelectedSuggestion(item); 
                      setQuery(item.displayName); 
                    }}
                    style={[
                      styles.suggestionItem,
                      selectedSuggestion?.id === item.id && styles.suggestionItemSelected
                    ]}
                  >
                    <Avatar name={item.displayName} size={40} />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{item.displayName}</Text>
                      {item.email && <Text style={styles.suggestionEmail}>{item.email}</Text>}
                    </View>
                    {selectedSuggestion?.id === item.id && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Botones del modal */}
            <View style={styles.modalFooter}>
              <Button
                variant="outline"
                onPress={() => { setShowAddModal(false); setQuery(''); setSuggestions([]); setSelectedSuggestion(null); }}
                style={{ flex: 1, marginRight: 8 }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={onSend}
                disabled={!query.trim() && !selectedSuggestion}
                style={{ flex: 1, marginLeft: 8 }}
              >
                Enviar Solicitud
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
