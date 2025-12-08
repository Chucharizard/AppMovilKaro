import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import { Button, Card, Avatar } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { mockChats, mockMessages } from '../mock/mockData';

export default function MessagingScreen() {
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
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      ...theme.shadows.sm,
    },
    headerTitle: {
      fontSize: theme.fonts.xl,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.textPrimary,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    chatTypeButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.sm,
    },
    groupButton: {
      backgroundColor: theme.colors.secondary,
    },
    chatTypeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    emptyMessage: {
      fontSize: theme.fonts.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    chatList: {
      paddingVertical: theme.spacing.sm,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDark,
    },
    chatInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    chatTitle: {
      fontSize: theme.fonts.md,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    chatLastMessage: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
    },
    unreadText: {
      color: theme.colors.surface,
      fontSize: theme.fonts.xs,
      fontWeight: theme.fontWeights.bold,
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      ...theme.shadows.sm,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    backButtonText: {
      fontSize: theme.fonts.md,
      color: theme.colors.primary,
      fontWeight: theme.fontWeights.semibold,
    },
    chatHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatHeaderTitle: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textPrimary,
      marginLeft: theme.spacing.sm,
    },
    emptyMessagesContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyMessagesIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
    },
    emptyMessagesText: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    emptyMessagesSubtext: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
    },
    messagesList: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messageContainer: {
      flexDirection: 'row',
      marginVertical: theme.spacing.xs,
      alignItems: 'flex-end',
    },
    myMessageContainer: {
      flexDirection: 'row-reverse',
    },
    messageHeader: {
      marginRight: theme.spacing.xs,
    },
    messageBubble: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      maxWidth: '75%',
      ...theme.shadows.sm,
    },
    myMessageBubble: {
      backgroundColor: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
    messageSender: {
      fontSize: theme.fonts.xs,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    messageText: {
      fontSize: theme.fonts.md,
      color: theme.colors.textPrimary,
      lineHeight: 20,
    },
    myMessageText: {
      color: theme.colors.surface,
    },
    messageTime: {
      fontSize: theme.fonts.xs,
      color: theme.colors.textLight,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    myMessageTime: {
      color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceDark,
    },
    messageInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fonts.md,
      color: theme.colors.textPrimary,
      maxHeight: 100,
      marginRight: theme.spacing.sm,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.surfaceDark,
    },
    sendButtonText: {
      fontSize: 20,
      color: theme.colors.surface,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.card || theme.colors.surface,
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
      borderBottomColor: theme.colors.border || theme.colors.surfaceDark,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text || theme.colors.textPrimary,
    },
    closeButton: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.textLight || theme.colors.textSecondary,
      padding: 4,
    },
    groupNameInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
      fontSize: 15,
      color: theme.colors.text || theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border || theme.colors.surfaceDark,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      margin: theme.spacing.lg,
      fontSize: 15,
      color: theme.colors.text || theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border || theme.colors.surfaceDark,
    },
    selectedUsersContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    selectedUsersLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textLight || theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    selectedUserChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    selectedUserName: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      marginRight: 4,
    },
    removeUserIcon: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    searchResultsContainer: {
      maxHeight: 300,
      paddingHorizontal: theme.spacing.lg,
    },
    userResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    userResultItemSelected: {
      backgroundColor: theme.colors.primaryLight || 'rgba(74, 144, 226, 0.1)',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    userResultInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    userResultName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text || theme.colors.textPrimary,
      marginBottom: 2,
    },
    userResultEmail: {
      fontSize: 13,
      color: theme.colors.textLight || theme.colors.textSecondary,
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
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border || theme.colors.surfaceDark,
    },
  }), [theme]);
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para crear nuevo chat
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatType, setChatType] = useState('privado'); // 'privado' o 'grupo'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await loadAuth();
        if (auth && auth.user) {
          if (mounted) setCurrentUser(auth.user);
        }
      } catch (e) {
        console.debug('[Messaging] loadAuth failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        console.log('[Messaging] Cargando chats...');
        const res = await api.getChats().catch(err => {
          console.warn('[Messaging] Error del backend:', err);
          console.warn('[Messaging] Usando datos de ejemplo (mock)');
          return mockChats;
        });
        console.log('[Messaging] Chats response:', res);
        if (mounted) setChats(Array.isArray(res) ? res : mockChats);
      } catch (e) {
        console.warn('[Messaging] Error cargando chats:', e);
        if (mounted) setChats(mockChats);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openChat = async (chat) => {
    setSelectedChat(chat);
    setLoading(true);
    try {
      const chatId = chat.id_conversacion || chat.id;
      console.log('[Messaging] Abriendo chat:', chatId);
      const msgs = await api.getChatMessages(chatId).catch(err => {
        console.warn('[Messaging] Error del backend:', err);
        console.warn('[Messaging] Usando mensajes de ejemplo (mock)');
        return mockMessages[chatId] || [];
      });
      console.log('[Messaging] Mensajes response:', msgs);
      setMessages(Array.isArray(msgs) ? msgs : (mockMessages[chatId] || []));
    } catch (e) {
      console.warn('[Messaging] Error obteniendo mensajes:', e);
      setMessages(mockMessages[chat.id_conversacion || chat.id] || []);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!selectedChat || !msgText.trim()) return;
    setSending(true);
    try {
      const chatId = selectedChat.id_conversacion || selectedChat.id;
      await api.sendMessage(chatId, { text: msgText.trim() });
      setMsgText('');
      // refresh messages
      const msgs = await api.getChatMessages(chatId);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.warn('[Messaging] Error enviando mensaje:', e);
      alert('Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  // Buscar usuarios
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (e) {
        console.warn('[Messaging] Error buscando usuarios:', e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleUserSelection = (user) => {
    const userId = user.id || user.id_user;
    const isSelected = selectedUsers.some(u => (u.id || u.id_user) === userId);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => (u.id || u.id_user) !== userId));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const createChat = async () => {
    if (chatType === 'privado' && selectedUsers.length !== 1) {
      alert('Selecciona un usuario para el chat privado');
      return;
    }
    if (chatType === 'grupo' && selectedUsers.length < 2) {
      alert('Selecciona al menos 2 usuarios para el grupo');
      return;
    }
    if (chatType === 'grupo' && !groupName.trim()) {
      alert('Ingresa un nombre para el grupo');
      return;
    }

    setCreating(true);
    try {
      const participantes = selectedUsers.map(u => u.id || u.id_user);
      const newChat = await api.createConversation(
        participantes,
        chatType,
        chatType === 'grupo' ? groupName.trim() : undefined
      );
      
      // Actualizar lista de chats
      const updatedChats = await api.getChats();
      setChats(Array.isArray(updatedChats) ? updatedChats : []);
      
      // Cerrar modal y limpiar
      setShowCreateModal(false);
      setSearchQuery('');
      setSelectedUsers([]);
      setGroupName('');
      setChatType('privado');
      
      // Abrir el nuevo chat
      if (newChat) {
        openChat(newChat);
      }
    } catch (e) {
      console.warn('[Messaging] Error creando chat:', e);
      alert('Error creando chat: ' + (e.message || 'Inténtalo de nuevo'));
    } finally {
      setCreating(false);
    }
  };

  const renderChatItem = ({ item }) => {
    const chatTitle = item.title || item.name || item.nombre || item.otherUser?.nombre || 'Chat sin nombre';
    const lastMessageObj = item.lastMessage || item.ultimo_mensaje;
    const lastMessage = lastMessageObj?.contenido || lastMessageObj?.text || 'Sin mensajes';
    const unreadCount = item.unreadCount || item.mensajes_no_leidos || item.no_leidos || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        <Avatar name={chatTitle} size="md" />
        <View style={styles.chatInfo}>
          <Text style={styles.chatTitle}>{chatTitle}</Text>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage =
      currentUser &&
      (item.sender === currentUser.id_user ||
        item.from === currentUser.id_user ||
        item.id_remitente === currentUser.id_user);

    const senderName = item.sender || item.from || item.usuario?.nombre || 'Usuario';
    const messageText = item.text || item.body || item.contenido || JSON.stringify(item);
    const timestamp = item.timestamp || item.fecha || item.fecha_creacion;

    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        {!isMyMessage && (
          <View style={styles.messageHeader}>
            <Avatar name={senderName} size="sm" />
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
          {!isMyMessage && (
            <Text style={styles.messageSender}>{senderName}</Text>
          )}
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {messageText}
          </Text>
          {timestamp && (
            <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (!selectedChat) {
    // Lista de chats
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💬 Mensajes</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.chatTypeButton}
              onPress={() => { setChatType('privado'); setShowCreateModal(true); }}
              activeOpacity={0.7}
            >
              <Text style={styles.chatTypeButtonText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatTypeButton, styles.groupButton]}
              onPress={() => { setChatType('grupo'); setShowCreateModal(true); }}
              activeOpacity={0.7}
            >
              <Text style={styles.chatTypeButtonText}>👥 Grupo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No tienes conversaciones</Text>
            <Text style={styles.emptyMessage}>
              Inicia una conversación para comenzar a chatear
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item, index) => item.id_conversacion || item.id || item._id || String(index)}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatList}
          />
        )}

        {/* Modal para crear chat */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {chatType === 'privado' ? '💬 Nuevo Chat' : '👥 Nuevo Grupo'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    setSearchQuery('');
                    setSelectedUsers([]);
                    setGroupName('');
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Input de nombre de grupo si es tipo grupo */}
              {chatType === 'grupo' && (
                <TextInput
                  placeholder="Nombre del grupo"
                  placeholderTextColor={theme.colors.textLight}
                  value={groupName}
                  onChangeText={setGroupName}
                  style={styles.groupNameInput}
                />
              )}

              {/* Buscador de usuarios */}
              <TextInput
                placeholder="Buscar usuarios..."
                placeholderTextColor={theme.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                autoFocus
              />

              {/* Usuarios seleccionados */}
              {selectedUsers.length > 0 && (
                <View style={styles.selectedUsersContainer}>
                  <Text style={styles.selectedUsersLabel}>Seleccionados:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedUsers.map((user) => {
                      const userName = user.nombre || user.name || user.username || user.email;
                      return (
                        <TouchableOpacity
                          key={user.id || user.id_user}
                          style={styles.selectedUserChip}
                          onPress={() => toggleUserSelection(user)}
                        >
                          <Text style={styles.selectedUserName}>{userName}</Text>
                          <Text style={styles.removeUserIcon}>×</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Loading indicator */}
              {searching && (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 12 }} />
              )}

              {/* Resultados de búsqueda */}
              <ScrollView style={styles.searchResultsContainer}>
                {searchResults.map((user) => {
                  const userName = user.nombre || user.name || user.username || user.email;
                  const userId = user.id || user.id_user;
                  const isSelected = selectedUsers.some(u => (u.id || u.id_user) === userId);
                  
                  return (
                    <TouchableOpacity
                      key={userId}
                      style={[
                        styles.userResultItem,
                        isSelected && styles.userResultItemSelected
                      ]}
                      onPress={() => toggleUserSelection(user)}
                    >
                      <Avatar name={userName} size={40} />
                      <View style={styles.userResultInfo}>
                        <Text style={styles.userResultName}>{userName}</Text>
                        {user.email && (
                          <Text style={styles.userResultEmail}>{user.email}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Botones del modal */}
              <View style={styles.modalFooter}>
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowCreateModal(false);
                    setSearchQuery('');
                    setSelectedUsers([]);
                    setGroupName('');
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onPress={createChat}
                  disabled={creating || selectedUsers.length === 0 || (chatType === 'grupo' && !groupName.trim())}
                  style={{ flex: 1, marginLeft: 8 }}
                >
                  {creating ? 'Creando...' : 'Crear'}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Vista de conversación
  const chatTitle = selectedChat.title || selectedChat.name || selectedChat.nombre || selectedChat.otherUser?.nombre || 'Chat';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => {
            setSelectedChat(null);
            setMessages([]);
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Avatar name={chatTitle} size="sm" />
          <Text style={styles.chatHeaderTitle}>{chatTitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyMessagesContainer}>
          <Text style={styles.emptyMessagesIcon}>💭</Text>
          <Text style={styles.emptyMessagesText}>No hay mensajes aún</Text>
          <Text style={styles.emptyMessagesSubtext}>
            Sé el primero en enviar un mensaje
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m, i) => String(m.id || m._id || i)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted={false}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={msgText}
          onChangeText={setMsgText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={theme.colors.textLight}
          style={styles.messageInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!msgText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={send}
          disabled={!msgText.trim() || sending}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
