import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '../../theme';

/**
 * Tarjeta moderna con sombra y estilos
 * @param {string} variant - 'default' | 'flat' | 'outlined'
 */
const Card = ({ children, variant = 'default', style, ...props }) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];

    switch (variant) {
      case 'flat':
        return [...baseStyle, styles.cardFlat];
      case 'outlined':
        return [...baseStyle, styles.cardOutlined];
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[...getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardFlat: {
    ...theme.shadows.none,
    backgroundColor: theme.colors.background,
  },
  cardOutlined: {
    ...theme.shadows.none,
    borderWidth: 1,
    borderColor: theme.colors.surfaceDark,
  },
});

export default Card;
