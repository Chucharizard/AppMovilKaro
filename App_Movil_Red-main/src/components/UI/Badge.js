import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Badge para notificaciones y contadores
 * @param {number} count - Número a mostrar
 * @param {string} variant - 'primary' | 'danger' | 'success' | 'warning'
 * @param {boolean} dot - Mostrar solo punto sin número
 */
const Badge = ({ count = 0, variant = 'danger', dot = false, style }) => {
  const { theme } = useTheme();
  
  if (count === 0 && !dot) return null;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'danger':
        return theme.colors.accent;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.accent;
    }
  };

  if (dot) {
    return (
      <View
        style={[
          {
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: theme.colors.surface,
            backgroundColor: getBackgroundColor(),
          },
          style,
        ]}
      />
    );
  }

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View
      style={[
        {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          paddingHorizontal: 6,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.sm,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: theme.fontWeights.bold,
        }}
      >
        {displayCount}
      </Text>
    </View>
  );
};

export default Badge;
