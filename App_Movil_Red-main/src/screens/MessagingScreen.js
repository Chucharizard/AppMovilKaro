import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import api from '../lib/api';
import { loadAuth } from '../lib/auth';
import { Button, Card, Avatar } from '../components/UI';
import theme from '../theme';

export default function MessagingScreen() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
        const res = await api.getChats();
        console.log('[Messaging] Chats response:', res);
        if (mounted) setChats(Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('[Messaging] Error cargando chats:', e);
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
      console.log('[Messaging] Abriendo chat:', chat.id);
      const msgs = await api.getChatMessages(chat.id);
      console.log('[Messaging] Mensajes response:', msgs);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.warn('[Messaging] Error obteniendo mensajes:', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!selectedChat || !msgText.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(selectedChat.id, { text: msgText.trim() });
      setMsgText('');
      // refresh messages
      const msgs = await api.getChatMessages(selectedChat.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.warn('[Messaging] Error enviando mensaje:', e);
      alert('Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  const renderChatItem = ({ item }) => {
    const chatTitle = item.title || item.name || item.otherUser?.nombre || 'Chat sin nombre';
    const lastMessage = item.lastMessage || item.ultimoMensaje || 'Sin mensajes';
    const unreadCount = item.unreadCount || item.no_leidos || 0;

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
          <Button
            variant="outline"
            size="sm"
            onPress={() => alert('Crear chat/grupo (funcionalidad pendiente)')}
          >
            + Nuevo
          </Button>
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
            keyExtractor={(i) => String(i.id || i._id)}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatList}
          />
        )}
      </View>
    );
  }

  // Vista de conversación
  const chatTitle = selectedChat.title || selectedChat.name || selectedChat.otherUser?.nombre || 'Chat';

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
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.fonts.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textPrimary,
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
});
