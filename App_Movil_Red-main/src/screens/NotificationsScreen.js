import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../lib/api';
import { Button, Card } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

export default function NotificationsScreen() {
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
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDark,
    },
    headerTitle: {
      fontSize: theme.fonts.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadBanner: {
      backgroundColor: theme.colors.primary + '20',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    unreadBannerText: {
      fontSize: theme.fonts.sm,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    notifCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    unreadNotif: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    notifIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    iconText: {
      fontSize: 24,
    },
    notifContent: {
      flex: 1,
    },
    notifTitle: {
      fontSize: theme.fonts.md,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    unreadText: {
      fontWeight: '700',
    },
    notifMessage: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.xs,
    },
    notifDate: {
      fontSize: theme.fonts.xs,
      color: theme.colors.textLight,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.fonts.lg,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textLight,
    },
  }), [theme]);
  
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifs(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('[Notifs] error', e);
      setNotifs([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      await loadNotifications();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      // Actualizar localmente
      setNotifs(notifs.map(n => 
        n.id_notificacion === notificationId ? { ...n, leida: true } : n
      ));
    } catch (e) {
      console.warn('[Notifs] error marcando como leída', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      // Actualizar localmente
      setNotifs(notifs.map(n => ({ ...n, leida: true })));
    } catch (e) {
      console.warn('[Notifs] error marcando todas como leídas', e);
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.leida;
    const tipo = item.tipo || 'info';
    const titulo = item.titulo || 'Notificación';
    const contenido = item.contenido || item.mensaje || item.text || '';
    const fecha = item.fecha_envio || item.fecha;

    // Emoji según tipo de notificación
    const getIcon = () => {
      switch(tipo) {
        case 'amigo': return '👥';
        case 'mensaje': return '💬';
        case 'reaccion': return '❤️';
        case 'comentario': return '💭';
        case 'carpooling': return '🚗';
        case 'evento': return '📅';
        default: return '🔔';
      }
    };

    return (
      <TouchableOpacity 
        onPress={() => isUnread && markAsRead(item.id_notificacion)}
        style={[styles.notifCard, isUnread && styles.unreadNotif]}
      >
        <View style={styles.notifIcon}>
          <Text style={styles.iconText}>{getIcon()}</Text>
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, isUnread && styles.unreadText]}>{titulo}</Text>
          <Text style={styles.notifMessage}>{contenido}</Text>
          {fecha && (
            <Text style={styles.notifDate}>
              {new Date(fecha).toLocaleDateString()} {new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔔 Notificaciones</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const unreadCount = notifs.filter(n => !n.leida).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notificaciones</Text>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onPress={markAllAsRead}>
            Marcar todas leídas
          </Button>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
          </Text>
        </View>
      )}

      <FlatList 
        data={notifs}
        renderItem={renderNotification}
        keyExtractor={(item, index) => item.id_notificacion || item.id || String(index)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No hay notificaciones</Text>
            <Text style={styles.emptySubtext}>Te avisaremos cuando tengas algo nuevo</Text>
          </View>
        }
      />
    </View>
  );
}
