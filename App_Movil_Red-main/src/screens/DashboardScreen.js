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
import { Badge } from '../components/UI';
import theme from '../theme';

const TABS = [
  { key: 'social', label: 'Social', icon: '📱' },
  { key: 'academia', label: 'Academia', icon: '🎓' },
  { key: 'carpool', label: 'Carpool', icon: '🚗' },
  { key: 'messages', label: 'Mensajes', icon: '💬' },
  { key: 'friends', label: 'Amigos', icon: '👥' },
  { key: 'notifications', label: 'Notifs', icon: '🔔' },
  { key: 'profile', label: 'Perfil', icon: '👤' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️' },
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

  // Notificaciones badge count (mock - en producción vendría del state)
  const notificationCount = 0;
  const messageCount = 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.tabbar}>
        {TABS.map(t => {
          const isActive = active === t.key;
          const showBadge = (t.key === 'notifications' && notificationCount > 0) ||
                           (t.key === 'messages' && messageCount > 0);
          const badgeCount = t.key === 'notifications' ? notificationCount : messageCount;

          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => setActive(t.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {t.icon}
                </Text>
                {showBadge && (
                  <View style={styles.badgeContainer}>
                    <Badge count={badgeCount} variant="danger" />
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  tabbar: {
    height: theme.components.tabBar.height,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceDark,
    paddingBottom: theme.spacing.xs,
    ...theme.shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xs,
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  tabLabel: {
    fontSize: theme.fonts.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.regular,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
});
