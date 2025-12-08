import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { Card, Avatar, Button } from '../components/UI';

export default function ProfileScreen({ user }) {
  const { theme } = useTheme();
  const [profile, setProfile] = useState(user || null);
  const [stats, setStats] = useState({ posts: 0, friends: 0, reactions: 0 });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: theme.spacing.lg,
      borderBottomLeftRadius: theme.borderRadius.xl,
      borderBottomRightRadius: theme.borderRadius.xl,
      ...theme.shadows.lg,
    },
    headerContent: {
      alignItems: 'center',
    },
    avatarContainer: {
      marginBottom: theme.spacing.md,
      borderWidth: 4,
      borderColor: theme.colors.surface,
      borderRadius: 999,
      ...theme.shadows.xl,
    },
    name: {
      fontSize: theme.fonts.xxl,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.surface,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    email: {
      fontSize: theme.fonts.md,
      color: theme.colors.surface,
      opacity: 0.9,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    roleBadge: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      marginTop: theme.spacing.sm,
    },
    roleText: {
      color: theme.colors.primary,
      fontSize: theme.fonts.sm,
      fontWeight: theme.fontWeights.semibold,
    },
    content: {
      padding: theme.spacing.lg,
    },
    statsCard: {
      marginTop: -30,
      marginBottom: theme.spacing.lg,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: theme.spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: theme.fonts.xl,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
    },
    sectionCard: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDark,
    },
    infoLabel: {
      fontSize: theme.fonts.md,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: theme.fonts.md,
      color: theme.colors.textPrimary,
      fontWeight: theme.fontWeights.medium,
      flex: 2,
    },
    actionsContainer: {
      gap: theme.spacing.md,
    },
    actionButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceDark,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.fonts.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  }), [theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user && user.id_user) {
          const p = await api.getProfile(user.id_user);
          if (mounted) setProfile(p || user);
          
          // Cargar estadísticas reales
          const [posts, friends] = await Promise.all([
            api.getPosts({ skip: 0, limit: 1000 }).catch(() => []),
            api.getFriends().catch(() => []),
          ]);

          // Filtrar publicaciones del usuario actual
          const userPosts = Array.isArray(posts) 
            ? posts.filter(post => post.id_user === user.id_user || (post.usuario && post.usuario.id_user === user.id_user))
            : [];

          // Contar reacciones totales en las publicaciones del usuario
          const totalReactions = userPosts.reduce((sum, post) => {
            return sum + (post.reacciones_count || 0);
          }, 0);

          if (mounted) {
            setStats({
              posts: userPosts.length,
              friends: Array.isArray(friends) ? friends.length : 0,
              reactions: totalReactions,
            });
          }
        }
      } catch (e) {
        console.warn('[Profile] error', e);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (!profile) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No hay usuario cargado</Text>
      </View>
    );
  }

  const fullName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Usuario';
  const email = profile.correo || profile.email || 'Sin correo';
  const role = profile.rol || 'Estudiante';

  return (
    <View style={styles.container}>
      {/* Header con avatar */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Avatar name={fullName} size="xl" />
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Tarjeta de estadísticas */}
        <Card style={styles.statsCard}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Publicaciones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.friends}</Text>
              <Text style={styles.statLabel}>Amigos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.reactions}</Text>
              <Text style={styles.statLabel}>Reacciones</Text>
            </View>
          </View>
        </Card>

        {/* Información personal */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre completo</Text>
            <Text style={styles.infoValue}>{fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{role}</Text>
          </View>
          {profile.ci && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CI</Text>
              <Text style={styles.infoValue}>{profile.ci}</Text>
            </View>
          )}
          {profile.telefono && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{profile.telefono}</Text>
            </View>
          )}
        </Card>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <Button 
            title="Editar Perfil" 
            onPress={() => alert('Próximamente')}
            style={styles.actionButton}
          />
          <Button 
            title="Ver mis publicaciones" 
            onPress={() => alert('Próximamente')}
            style={styles.actionButton}
          />
        </View>

        {/* Espacio adicional al final */}
        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </View>
  );
}
