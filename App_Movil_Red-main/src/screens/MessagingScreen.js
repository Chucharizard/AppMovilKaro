import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';

export default function MessagingScreen() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getChats();
        if (mounted) setChats(Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('[Messaging] error', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const msgs = await api.getChatMessages(chat.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.warn('[Messaging] get messages error', e);
      setMessages([]);
    }
  };

  const send = async () => {
    if (!selectedChat || !msgText.trim()) return;
    try {
      await api.sendMessage(selectedChat.id, { text: msgText.trim() });
      setMsgText('');
      // refresh messages
      const msgs = await api.getChatMessages(selectedChat.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.warn('[Messaging] send error', e);
      alert('Error enviando mensaje');
    }
  };

  return (
    <View style={styles.container}>
      {!selectedChat ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Mensajes</Text>
            <Button title="Nuevo" onPress={() => alert('Crear chat/grupo (placeholder)')} />
          </View>
          <FlatList data={chats} keyExtractor={i => String(i.id)} renderItem={({item}) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
              <Text style={styles.chatTitle}>{item.title || item.name || 'Chat'}</Text>
              <Text style={styles.chatLast}>{item.lastMessage || 'Último mensaje (placeholder)'}</Text>
            </TouchableOpacity>
          )} />
        </>
      ) : (
        <>
          <View style={[styles.headerRow, { marginBottom: 12 }] }>
            <Button title="Atrás" onPress={() => { setSelectedChat(null); setMessages([]); }} />
            <Text style={styles.title}>{selectedChat.title || 'Chat'}</Text>
            <View style={{ width: 64 }} />
          </View>
          <FlatList data={messages} keyExtractor={(m,i) => String(m.id || i)} renderItem={({item}) => (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontWeight: '700' }}>{item.sender || item.from || 'Usuario'}</Text>
              <Text>{item.text || item.body || JSON.stringify(item)}</Text>
            </View>
          )} />
          <View style={{ padding: 8, borderTopWidth: 1, borderColor: '#eee' }}>
            <TextInput value={msgText} onChangeText={setMsgText} placeholder="Escribe un mensaje..." style={styles.input} />
            <View style={{ height: 8 }} />
            <Button title="Enviar" onPress={send} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 12 }, headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, title: { fontSize: 18, fontWeight: '700' }, chatItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }, chatTitle: { fontWeight: '600' }, chatLast: { color: '#666', marginTop: 4 }, input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, backgroundColor: '#fff' } });
