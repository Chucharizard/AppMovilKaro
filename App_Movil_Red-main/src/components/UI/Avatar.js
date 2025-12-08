import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Avatar circular con borde y fallback a iniciales
 * @param {string} source - URI de la imagen
 * @param {string} name - Nombre para mostrar iniciales
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} online - Muestra indicador de online
 */
const Avatar = ({
  source,
  name = '',
  size = 'md',
  online = false,
  style,
}) => {
  const { theme } = useTheme();
  const getSize = () => {
    switch (size) {
      case 'sm':
        return theme.components.avatar.sm;
      case 'md':
        return theme.components.avatar.md;
      case 'lg':
        return theme.components.avatar.lg;
      default:
        return theme.components.avatar.md;
    }
  };

  const avatarSize = getSize();

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = () => {
    // Genera un color basado en el nombre
    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.info,
      theme.colors.warning,
      '#9B59B6',
      '#E67E22',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: theme.colors.surface,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
          !source && { backgroundColor: getBackgroundColor() },
        ]}
      >
        {source ? (
          <Image
            source={{ uri: source }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              resizeMode: 'cover',
            }}
          />
        ) : (
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: theme.fontWeights.bold,
              fontSize: avatarSize / 2.5,
            }}
          >
            {getInitials()}
          </Text>
        )}
      </View>
      {online && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: theme.colors.success,
            borderWidth: 2,
            borderColor: theme.colors.surface,
            width: avatarSize / 4,
            height: avatarSize / 4,
            borderRadius: avatarSize / 8,
            right: avatarSize / 20,
            bottom: avatarSize / 20,
          }}
        />
      )}
    </View>
  );
};

export default Avatar;
