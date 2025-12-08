import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ onLogout }) {
  const { theme, isDark, toggleTheme } = useTheme();

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>⚙️ Ajustes</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Sección de Apariencia */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎨 Apariencia</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingIcon, { color: theme.colors.text }]}>🌙</Text>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Modo Oscuro</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textLight }]}>
                  Activa el tema oscuro para reducir el brillo
                </Text>
              </View>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={handleToggleTheme}
              trackColor={{ false: theme.colors.surfaceDark, true: theme.colors.primary }}
              thumbColor={isDark ? theme.colors.secondary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sección de Cuenta */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>👤 Cuenta</Text>
          
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔐</Text>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Cambiar Contraseña</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Notificaciones</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.colors.textLight }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <View style={styles.logoutSection}>
          <Button
            variant="outline"
            onPress={() => {
              Alert.alert(
                'Cerrar Sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Cerrar Sesión', onPress: onLogout, style: 'destructive' }
                ]
              );
            }}
            style={{ borderColor: theme.colors.error }}
          >
            <Text style={{ color: theme.colors.error, fontWeight: '600' }}>🚪 Cerrar Sesión</Text>
          </Button>
        </View>

        {/* Versión */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textLight }]}>
            Versión 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
  },
});
