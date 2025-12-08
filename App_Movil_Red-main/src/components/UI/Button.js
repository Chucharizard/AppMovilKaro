import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    };

    const sizeStyles = {
      sm: { height: 36, paddingHorizontal: theme.spacing.md },
      md: { height: 48, paddingHorizontal: theme.spacing.lg },
      lg: { height: 56, paddingHorizontal: theme.spacing.xl },
    };

    if (disabled || loading) {
      return { ...baseStyle, ...sizeStyles[size], backgroundColor: theme.colors.surfaceDark, opacity: 0.6 };
    }

    const variantStyles = {
      primary: { backgroundColor: theme.colors.primary },
      secondary: { backgroundColor: theme.colors.secondary },
      danger: { backgroundColor: theme.colors.error },
      success: { backgroundColor: theme.colors.success },
      outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary },
    };

    return { ...baseStyle, ...sizeStyles[size], ...(variantStyles[variant] || variantStyles.primary) };
  };

  const getTextStyle = () => {
    const sizeStyles = {
      sm: { fontSize: theme.fonts.sm },
      md: { fontSize: theme.fonts.md },
      lg: { fontSize: theme.fonts.lg },
    };

    return {
      color: variant === 'outline' ? theme.colors.primary : '#FFFFFF',
      fontWeight: theme.fontWeights.semibold,
      ...sizeStyles[size],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
