import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SocialScreen from './SocialScreen';
import AcademiaScreen from './AcademiaScreen';
import CarpoolingScreen from './CarpoolingScreen';
import MessagingScreen from './MessagingScreen';
import FriendsScreen from './FriendsScreen';
import NotificationsScreen from './NotificationsScreen';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';

const TABS = [
  { key: 'social', label: 'Social' },
  { key: 'academia', label: 'Academia' },
  { key: 'carpool', label: 'Carpool' },
  { key: 'messages', label: 'Mensajes' },
  { key: 'friends', label: 'Amigos' },
  { key: 'notifications', label: 'Notifs' },
  { key: 'settings', label: 'Ajustes' },
  { key: 'profile', label: 'Perfil' },
];

export default function DashboardScreen({ user, onLogout }) {
  const [active, setActive] = useState('social');

  const renderContent = () => {
    switch (active) {
      case 'social': return <SocialScreen user={user} />;
      case 'academia': return <AcademiaScreen user={user} />;
      case 'carpool': return <CarpoolingScreen user={user} />;
      case 'messages': return <MessagingScreen user={user} />;
      case 'friends': return <FriendsScreen user={user} />;
      case 'notifications': return <NotificationsScreen user={user} />;
      case 'settings': return <SettingsScreen user={user} onLogout={onLogout} />;
      case 'profile': return <ProfileScreen user={user} />;
      default: return <SocialScreen user={user} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.tabbar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setActive(t.key)}>
            <Text style={[styles.tabLabel, active === t.key && styles.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabbar: { height: 56, flexDirection: 'row', borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, color: '#444' },
  tabActive: { color: '#0a84ff', fontWeight: '600' },
});
