import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import theme from '../../theme';

/**
 * Botón moderno con diferentes variantes
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Muestra loading spinner
 * @param {boolean} disabled - Deshabilita el botón
 */
const Button = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
      return baseStyle;
    }

    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.buttonPrimary];
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary];
      case 'danger':
        return [...baseStyle, styles.buttonDanger];
      case 'success':
        return [...baseStyle, styles.buttonSuccess];
      case 'outline':
        return [...baseStyle, styles.buttonOutline];
      default:
        return [...baseStyle, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];

    if (variant === 'outline') {
      return [...baseStyle, styles.textOutline];
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  button_sm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  button_md: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  button_lg: {
    height: 56,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonDanger: {
    backgroundColor: theme.colors.error,
  },
  buttonSuccess: {
    backgroundColor: theme.colors.success,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surfaceDark,
    opacity: 0.6,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeights.semibold,
  },
  text_sm: {
    fontSize: theme.fonts.sm,
  },
  text_md: {
    fontSize: theme.fonts.md,
  },
  text_lg: {
    fontSize: theme.fonts.lg,
  },
  textOutline: {
    color: theme.colors.primary,
  },
});

export default Button;
