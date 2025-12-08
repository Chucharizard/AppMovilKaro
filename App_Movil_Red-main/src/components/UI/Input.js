import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && styles.inputFocused,
          error && styles.inputError,
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceDark,
    fontSize: theme.fonts.md,
    color: theme.colors.textPrimary,
  },
  inputMultiline: {
    height: 100,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.fonts.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});

export default Input;
