import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image, Alert, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import api from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAuth } from '../lib/auth';
import { Button, Card, Input, Avatar } from '../components/UI';
import theme from '../theme';

const FILTERS = ['Todas', 'Solo amigos', 'Más likes'];

function PostItem({ post, onPreview }) {
  const [userReaction, setUserReaction] = React.useState(post.mi_reaccion || post.user_reaction || post.reaccion_usuario || null);
  const [count, setCount] = React.useState(post.reacciones_count || post.likes || 0);
  const [reacting, setReacting] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');

  const author = post.usuario ? `${post.usuario.nombre} ${post.usuario.apellido}` : (post.usuario || 'Anon');
  const content = post.contenido || post.texto || '';
  const date = post.fecha_creacion || post.date || '';

  const postId = post.id_publicacion || post.id || post._id;

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      const diff = Date.now() - dt.getTime();
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      if (diff < minute) return 'Ahora';
      if (diff < hour) return Math.floor(diff / minute) + 'm';
      if (diff < day) return Math.floor(diff / hour) + 'h';
      return dt.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const REACTIONS = [
    { key: 'like', emoji: '👍' },
    { key: 'love', emoji: '❤️' },
    { key: 'laugh', emoji: '😆' },
    { key: 'wow', emoji: '😮' },
    { key: 'angry', emoji: '😡' },
    { key: 'sad', emoji: '😢' },
  ];

  const handleReact = async (type) => {
    if (!postId) return;
    setReacting(true);
    try {
      const had = userReaction;
      if (had === type) {
        await api.removeReaction(postId, type).catch(() => {});
        setUserReaction(null);
        setCount(c => Math.max(0, c - 1));
      } else {
        await api.addReaction(postId, type).catch(() => {});
        setUserReaction(type);
        setCount(c => {
          let next = c;
          if (had) next = Math.max(0, next - 1);
          return next + 1;
        });
      }
    } catch (e) {
      console.warn('[PostItem] reaction failed', e);
      Alert.alert('Error', 'No se pudo enviar la reacción');
    } finally {
      setReacting(false);
      // cerrar panel de reacciones después de interactuar
      setShowReactions(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    setCommentsLoading(true);
    try {
      const res = await api.getComments(postId).catch((err) => { console.debug('[PostItem] getComments catch', err); return []; });
      console.log('[PostItem] getComments raw response', res);
      const list = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.comentarios ? res.comentarios : []));
      console.log('[PostItem] getComments normalized list length', Array.isArray(list) ? list.length : 0);

      // Merge with locally persisted comments (fallback when backend doesn't expose GET per-post)
      try {
        const key = `local_comments_v1:${postId}`;
        const txt = await AsyncStorage.getItem(key);
        const local = txt ? JSON.parse(txt) : [];
        // Merge, preferring server items; preserve local-only items
        const mergedMap = new Map();
        if (Array.isArray(local)) {
          for (const c of local) {
            const id = c && (c.id_comentario || c.id || (`local-${JSON.stringify(c).slice(0,40)}`));
            mergedMap.set(String(id), c);
          }
        }
        if (Array.isArray(list)) {
          for (const c of list) {
            const id = c && (c.id_comentario || c.id || (`srv-${JSON.stringify(c).slice(0,40)}`));
            mergedMap.set(String(id), c);
          }
        }
        const merged = Array.from(mergedMap.values());
        setComments(merged || []);
      } catch (e) {
        console.debug('[PostItem] merge local comments failed', e);
        setComments(list || []);
      }
    } catch (e) {
      console.warn('[PostItem] getComments failed', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    const text = (newComment || '').trim();
    if (!text) return;
    if (!postId) return;
    // Optimistic UI: add local temporary comment
    const temp = { id_comentario: `temp-${Date.now()}`, contenido: text, fecha_creacion: new Date().toISOString(), usuario: { nombre: 'Tú' } };
    setComments(prev => [temp, ...prev]);
    setNewComment('');
    try {
      const res = await api.addComment(postId, text);
      // If server returned the created comment, use it; otherwise synthesize one
      let created = null;
      if (res) created = Array.isArray(res) ? res[0] : res;
      if (!created) {
        let auth = null;
        try { auth = await loadAuth(); } catch (e) { auth = null; }
        const username = (auth && auth.user && (auth.user.nombre || auth.user.correo || auth.user.email)) || 'Tú';
        created = { id_comentario: `local-${Date.now()}`, contenido: text, fecha_creacion: new Date().toISOString(), id_user: auth && (auth.user && (auth.user.id_user || auth.user.id) || auth.id), usuario: { nombre: username } };
      }

      // Persist created comment in local cache so it will appear next time (backend may not provide GET)
      try {
        const key = `local_comments_v1:${postId}`;
        const txt = await AsyncStorage.getItem(key);
        const arr = txt ? JSON.parse(txt) : [];
        arr.unshift(created);
        await AsyncStorage.setItem(key, JSON.stringify(arr));
      } catch (e) {
        console.debug('[PostItem] save local comment failed', e);
      }

      // Refresh merged list (server may not expose GET, so local ensures visibility)
      await loadComments();
    } catch (e) {
      console.warn('[PostItem] addComment failed', e);
      Alert.alert('Error', 'No se pudo agregar el comentario');
      // remove temp
      setComments(prev => prev.filter(c => !(c.id_comentario && String(c.id_comentario).startsWith('temp-'))));
    }
  };

  return (
    <Card style={styles.post}>
      <View style={styles.postHeader}>
        <Avatar name={author} size="md" />
        <View style={styles.postHeaderText}>
          <Text style={styles.postAuthor}>{author}</Text>
          <Text style={styles.postDate}>{formatDate(date)}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{content}</Text>

      {post.media && post.media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
          {post.media.map((m, idx) => {
            const uri = typeof m === 'string' ? m : (m.url || m.file_url || m.path || m.key);
            if (!uri) return null;
            return (
              <TouchableOpacity key={uri + idx} onPress={() => onPreview(uri)}>
                <Image source={{ uri }} style={styles.mediaImage} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.reactionsContainer}>
        {showReactions && (
          <View style={styles.reactionsPanel}>
            {REACTIONS.map(r => {
              const selected = userReaction === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => handleReact(r.key)}
                  disabled={reacting}
                  style={[styles.reactionButton, selected && styles.reactionButtonSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.actionsBar}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              onPress={() => setShowReactions(s => !s)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>{userReaction ? 'Reaccionado' : 'Reaccionar'}</Text>
              {count > 0 && <Text style={styles.actionCount}>{count}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowComments(s => !s); if (!showComments) setTimeout(loadComments, 10); }}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Comentar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showComments && (
          <View style={styles.commentsSection}>
            {commentsLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              comments.map(c => {
                const commentAuthor = (c.usuario && (c.usuario.nombre || c.usuario.user)) || 'Anon';
                return (
                  <View key={c.id_comentario || c.id || Math.random()} style={styles.commentItem}>
                    <Avatar name={commentAuthor} size="sm" />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentAuthor}>{commentAuthor}</Text>
                      <Text style={styles.commentText}>{c.contenido || c.texto || c.comentario || ''}</Text>
                      <Text style={styles.commentDate}>
                        {(c.fecha_creacion && new Date(c.fecha_creacion).toLocaleString()) || ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            <View style={styles.commentInputContainer}>
              <TextInput
                placeholder="Escribe un comentario..."
                value={newComment}
                onChangeText={setNewComment}
                style={styles.commentInput}
                placeholderTextColor={theme.colors.textLight}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.commentSubmitButton} activeOpacity={0.7}>
                <Text style={styles.commentSubmitText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function SocialScreen() {
  const [filter, setFilter] = useState('Todas');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [friendsIds, setFriendsIds] = useState([]);

  const load = async (useFilter) => {
    const currentFilter = useFilter || filter;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPosts({ skip: 0, limit: 50 });
      let filtered = Array.isArray(res) ? res : [];
      // Filtro "Solo amigos"
      if (currentFilter === 'Solo amigos') {
        // Helper: obtener author id de una publicación (varias formas posibles)
        const getAuthorId = (post) => {
          // posibles ubicaciones comunes
          if (!post) return null;
          const u = post.usuario || post.autor || post.user || post.author;
          const cand = [];
          if (u && typeof u === 'object') {
            cand.push(u.id_user, u.id, u._id, u.id_usuario, u.usuario_id, u.uuid);
          }
          cand.push(post.usuario_id, post.id_user, post.autor_id, post.user_id, post.userId, post.id_usuario);
          // devolver el primer valor no vacío
          for (const v of cand) if (v) return String(v);
          return null;
        };

        // Cargar lista de amigos si no está cargada
        if (!friendsIds || friendsIds.length === 0) {
          try {
            const friendsRes = await api.getFriends();
            console.log('[Social] getFriends response:', friendsRes);
            // Normalizar la respuesta para extraer ids de usuario
            const ids = new Set();
            if (Array.isArray(friendsRes)) {
              friendsRes.forEach(rel => {
                // Si rel es un usuario directamente
                if (rel && (rel.id_user || rel.id || rel._id || rel.id_usuario)) {
                  const maybe = rel.id_user || rel.id || rel._id || rel.id_usuario;
                  if (maybe) ids.add(String(maybe));
                  return;
                }

                // Si rel es una relación con usuario1/usuario2 o campos anidados
                const u1 = rel && (rel.usuario1 || rel.usuario || rel.user1);
                const u2 = rel && (rel.usuario2 || rel.user2);
                if (u1 && typeof u1 === 'object') {
                  const maybe = u1.id_user || u1.id || u1._id || u1.id_usuario;
                  if (maybe) ids.add(String(maybe));
                } else if (rel && rel.id_usuario1) {
                  ids.add(String(rel.id_usuario1));
                }
                if (u2 && typeof u2 === 'object') {
                  const maybe = u2.id_user || u2.id || u2._id || u2.id_usuario;
                  if (maybe) ids.add(String(maybe));
                } else if (rel && rel.id_usuario2) {
                  ids.add(String(rel.id_usuario2));
                }
                // Algunos backends devuelven 'amigo' o 'usuario' dentro de la relación
                const uA = rel && (rel.usuario || rel.amigo || rel.friend);
                if (uA && typeof uA === 'object') {
                  const maybe = uA.id_user || uA.id || uA._id || uA.id_usuario;
                  if (maybe) ids.add(String(maybe));
                }
              });
            }
            const idsArr = Array.from(ids);
            console.log('[Social] IDs de amigos extraídos:', idsArr);
            setFriendsIds(idsArr);

            if (idsArr.length === 0) {
              // No hay amigos, lista vacía pero no es error
              filtered = [];
            } else {
              filtered = filtered.filter(p => {
                const aid = getAuthorId(p);
                return aid && idsArr.includes(aid);
              });
            }
          } catch (err) {
            console.warn('[Social] error loading friends', err);
            // Si falla la carga, mostrar todas las publicaciones
            Alert.alert('Aviso', 'No se pudieron cargar los amigos. Mostrando todas las publicaciones.');
          }
        } else {
          filtered = filtered.filter(p => {
            const aid = (p && (p.usuario && (p.usuario.id_user || p.usuario.id) )) || p.id_user || p.usuario_id || p.autor_id || p.user_id || p.id_usuario || null;
            const aidStr = aid ? String(aid) : null;
            return aidStr && friendsIds.includes(aidStr);
          });
        }
      }

      // Filtro "Más likes" (ordenar por reacciones_count desc)
      if (currentFilter === 'Más likes') {
        filtered = filtered.sort((a, b) => (b.reacciones_count || 0) - (a.reacciones_count || 0));
      }

      setPosts(filtered);
    } catch (e) {
      console.warn('[Social] error fetching posts', e);
      setError(e);
      // Si la causa es token expirado o no autenticado, avisar al usuario
      try {
        if (e && e.status && (e.status === 401 || e.status === 403)) {
          Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        }
      } catch (alertErr) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await api.getEvents({ skip: 0, limit: 100 });
      const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      setEvents(list || []);
    } catch (e) {
      console.warn('[Social] loadEvents failed', e);
      setEventsError(e);
    } finally {
      setEventsLoading(false);
    }
  };

  const onRefresh = () => load(filter);

  const onFilterChange = (f) => {
    setFilter(f);
    load(f);
  };

  const onCreateDemo = async () => {
    try {
      await api.createPost({ contenido: 'Publicación demo desde app', tipo: 'texto' });
      onRefresh();
    } catch (e) {
      console.warn('[Social] create post failed', e);
      setError(e);
    }
  };

  const [newText, setNewText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // { uri, name, type }
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'events'
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  const pickImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (err) {
      console.warn('[Social] expo-image-picker require failed', err);
      Alert.alert('Dependencia faltante', 'Instala `expo-image-picker`:\n`expo install expo-image-picker` y reconstruye la app.');
      return;
    }

    if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
      Alert.alert('Módulo no disponible', 'El módulo `expo-image-picker` no está disponible. Ejecuta `npm install` y reconstruye la app.');
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm || !perm.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a la galería.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
      if (!res || res.cancelled || res.canceled) return;
      const uri = res.uri || (res.assets && res.assets[0] && res.assets[0].uri);
      if (!uri) {
        console.warn('[Social] pickImage: no URI in response', res);
        Alert.alert('Error', 'No se pudo obtener la imagen seleccionada.');
        return;
      }
      const name = uri.split('/').pop() || 'image.jpg';
      const ext = name.split('.').pop() || 'jpg';
      const type = res.type ? `${res.type}/${ext}` : `image/${ext}`;
      setSelectedFiles(prev => [...prev, { uri, name, type }]);
    } catch (e) {
      console.warn('[Social] pickImage error', e);
      Alert.alert('Error', 'No se pudo abrir el selector de imágenes.');
    }
  };

  const onCreate = async () => {
    const contenido = newText.trim();
    if (!contenido && selectedFiles.length === 0) return;
    try {
      let media_urls = undefined;
      if (selectedFiles.length > 0) {
        setUploading(true);
        const upRes = await api.uploadFiles(selectedFiles);
        setUploading(false);
        // upRes can be array of objects or object; try to extract URLs
        if (Array.isArray(upRes)) {
          media_urls = upRes.map(r => (typeof r === 'string' ? r : (r.url || r.file_url || r.key))).filter(Boolean);
        } else if (upRes) {
          media_urls = [upRes.url || upRes.file_url || upRes.key].filter(Boolean);
        }
      }

      await api.createPost({ contenido, tipo: media_urls && media_urls.length ? 'imagen' : 'texto', media_urls });
      setNewText('');
      setSelectedFiles([]);
      onRefresh();
    } catch (e) {
      console.warn('[Social] create post failed', e);
      setError(e);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            onPress={() => setViewMode('feed')}
            style={[styles.viewModeButton, viewMode === 'feed' && styles.viewModeButtonActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewModeText, viewMode === 'feed' && styles.viewModeTextActive]}>
              Publicaciones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setViewMode('events'); setTimeout(() => loadEvents(), 30); }}
            style={[styles.viewModeButton, viewMode === 'events' && styles.viewModeButtonActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewModeText, viewMode === 'events' && styles.viewModeTextActive]}>
              Eventos
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => { if (viewMode === 'events') loadEvents(); else onRefresh(); }}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'feed' && (
        <View style={styles.filtersContainer}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => onFilterChange(f)}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {viewMode === 'feed' ? (
        <Card style={styles.createPostCard}>
          <Input
            placeholder="¿Qué estás pensando?"
            value={newText}
            onChangeText={setNewText}
            multiline
            style={styles.createPostInput}
          />

          {selectedFiles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedFilesContainer}>
              {selectedFiles.map((f, idx) => (
                <View key={f.uri + idx} style={styles.selectedFileItem}>
                  <TouchableOpacity onPress={() => setPreviewUri(f.uri)} activeOpacity={0.7}>
                    <Image source={{ uri: f.uri }} style={styles.selectedFileImage} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                    style={styles.deleteFileButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteFileButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.createPostActions}>
            <Button variant="outline" size="sm" onPress={pickImage}>
              📷 Foto
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={onCreate}
              loading={uploading}
              disabled={!newText.trim() && selectedFiles.length === 0}
              style={styles.publishButton}
            >
              Publicar
            </Button>
          </View>

          <Modal visible={!!previewUri} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setPreviewUri(null)}>
              <View style={styles.previewContainer}>
                {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} /> : null}
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </Card>
      ) : (
        <View style={{ padding: 8 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Crear evento</Text>
          <TextInput placeholder="Título" value={newEventTitle} onChangeText={setNewEventTitle} style={[styles.input, { marginBottom: 8 }]} />
          <TextInput placeholder="Descripción" value={newEventDesc} onChangeText={setNewEventDesc} style={[styles.input, { marginBottom: 8 }]} multiline />
          <TextInput placeholder="Fecha (ISO o texto)" value={newEventDate} onChangeText={setNewEventDate} style={[styles.input, { marginBottom: 8 }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Crear evento" onPress={async () => {
              const title = (newEventTitle || '').trim();
              if (!title) { Alert.alert('Validación', 'El evento necesita título'); return; }
              try {
                setEventsLoading(true);
                await api.createEvent({ titulo: title, descripcion: newEventDesc, fecha: newEventDate });
                setNewEventTitle(''); setNewEventDesc(''); setNewEventDate('');
                await loadEvents();
              } catch (e) {
                console.warn('[Social] createEvent failed', e);
                Alert.alert('Error', 'No se pudo crear el evento');
              } finally { setEventsLoading(false); }
            }} />
            <View style={{ width: 12 }} />
            <Button title="Actualizar" onPress={loadEvents} />
          </View>

          <View style={{ height: 12 }} />
          {eventsLoading ? <ActivityIndicator /> : null}
          {eventsError ? <Text style={{ color: 'red' }}>{String(eventsError)}</Text> : null}
          {events && events.length === 0 && !eventsLoading && <Text style={{ color: '#666' }}>No hay eventos aún.</Text>}
          {events.map(ev => {
            const id = ev.id_evento || ev.id || ev._id || ev.event_id || ev.evento_id;
            const title = ev.titulo || ev.title || ev.nombre || ev.name || '';
            const desc = ev.descripcion || ev.description || ev.desc || '';
            const fecha = ev.fecha || ev.date || ev.fecha_inicio || '';
            const attendees = ev.asistentes_count || ev.attendees_count || ev.participants_count || (Array.isArray(ev.asistentes) ? ev.asistentes.length : 0);
            return (
              <View key={String(id) + title} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontWeight: '700' }}>{title}</Text>
                <Text style={{ color: '#444', marginTop: 4 }}>{desc}</Text>
                <Text style={{ color: '#888', marginTop: 4 }}>{fecha}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: '#666' }}>Asistentes: {attendees}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={async () => { try { await api.joinEvent(id); await loadEvents(); } catch (e) { console.warn('joinEvent', e); Alert.alert('Error', 'No se pudo unirse'); } }} style={{ padding: 8, backgroundColor: '#0a84ff', borderRadius: 6, marginRight: 8 }}>
                      <Text style={{ color: '#fff' }}>Unirse</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { try { await api.leaveEvent(id); await loadEvents(); } catch (e) { console.warn('leaveEvent', e); Alert.alert('Error', 'No se pudo salir'); } }} style={{ padding: 8, backgroundColor: '#ccc', borderRadius: 6 }}>
                      <Text>Salir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {error && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: 'red' }}>Error cargando publicaciones</Text>
        </View>
      )}

      <FlatList 
        data={posts} 
        keyExtractor={i => String(i.id_publicacion || i.id || i._id)} 
        renderItem={({item}) => <PostItem post={item} onPreview={(u)=>setPreviewUri(u)} />} 
        contentContainerStyle={{ padding: 12 }} 
        refreshing={loading} 
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                {filter === 'Solo amigos' 
                  ? 'No tienes amigos aún.\nAgrega amigos para ver sus publicaciones aquí.' 
                  : 'No hay publicaciones aún.\n¡Sé el primero en publicar!'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  viewModeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  viewModeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  viewModeText: {
    fontSize: theme.fonts.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.medium,
  },
  viewModeTextActive: {
    color: theme.colors.surface,
    fontWeight: theme.fontWeights.semibold,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
    color: theme.colors.surface,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceDark,
  },
  filterBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  filterActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.regular,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  createPostCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  createPostInput: {
    marginBottom: 0,
  },
  selectedFilesContainer: {
    marginTop: theme.spacing.md,
  },
  selectedFileItem: {
    marginRight: theme.spacing.sm,
    position: 'relative',
  },
  selectedFileImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  deleteFileButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteFileButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  publishButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  post: {
    marginHorizontal: theme.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  postHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  postAuthor: {
    fontSize: theme.fonts.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.textPrimary,
  },
  postDate: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: theme.fonts.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: theme.spacing.md,
  },
  mediaImage: {
    width: 280,
    height: 280,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  reactionsContainer: {
    marginTop: theme.spacing.md,
  },
  reactionsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  reactionButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
  },
  reactionButtonSelected: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceDark,
  },
  actionsLeft: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.medium,
  },
  actionCount: {
    fontSize: theme.fonts.xs,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeights.semibold,
  },
  commentsSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceDark,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  commentAuthor: {
    fontSize: theme.fonts.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.textPrimary,
  },
  commentText: {
    fontSize: theme.fonts.sm,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  commentDate: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    fontSize: theme.fonts.sm,
    color: theme.colors.textPrimary,
  },
  commentSubmitButton: {
    marginLeft: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  commentSubmitText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.surfaceDark,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 40,
    backgroundColor: theme.colors.surface,
    fontSize: theme.fonts.md,
    color: theme.colors.textPrimary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '92%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: theme.borderRadius.md,
  },
});
