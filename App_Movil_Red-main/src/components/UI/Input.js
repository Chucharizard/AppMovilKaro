import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Campo de texto moderno
 * @param {string} label - Etiqueta del campo
 * @param {string} error - Mensaje de error
 * @param {boolean} multiline - Permite múltiples líneas
 */
const Input = ({
  label,
  error,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[{ marginBottom: theme.spacing.md }, style]}>
      {label && (
        <Text
          style={{
            fontSize: theme.fonts.sm,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            height: multiline ? 100 : 48,
            borderRadius: 10,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.surface,
            borderWidth: isFocused ? 2 : 1,
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.primary
              : theme.colors.surfaceDark,
            fontSize: theme.fonts.md,
            color: theme.colors.textPrimary,
          },
          multiline && {
            paddingTop: theme.spacing.md,
            textAlignVertical: 'top',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: theme.fonts.xs,
            color: theme.colors.error,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
