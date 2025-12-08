import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Tarjeta moderna con sombra y estilos
 * @param {string} variant - 'default' | 'flat' | 'outlined'
 */
const Card = ({ children, variant = 'default', style, ...props }) => {
  const { theme } = useTheme();
  
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    };

    switch (variant) {
      case 'flat':
        return {
          ...baseStyle,
          ...theme.shadows.none,
          backgroundColor: theme.colors.background,
        };
      case 'outlined':
        return {
          ...baseStyle,
          ...theme.shadows.none,
          borderWidth: 1,
          borderColor: theme.colors.surfaceDark,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card;
