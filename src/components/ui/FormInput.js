import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const FormInput = ({
  label,
  icon,
  error,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.group, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrapper, focused && styles.wrapperFocused, error && styles.wrapperError]}>
        {icon ? (
          <Ionicons name={icon} size={20} color={theme.color.text.secondary} style={styles.icon} />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          placeholderTextColor={theme.color.text.muted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          accessibilityLabel={label || placeholder}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    marginBottom: theme.space[4],
  },
  label: {
    ...theme.textStyle('label', { weight: 'medium', color: theme.color.text.primary }),
    marginBottom: theme.space[2],
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.control,
    borderWidth: theme.borderWidth.strong,
    borderColor: 'transparent',
    paddingHorizontal: theme.space[4],
  },
  wrapperFocused: {
    borderColor: theme.color.primary[500],
  },
  wrapperError: {
    borderColor: theme.color.danger.main,
  },
  icon: {
    marginRight: theme.space[2],
  },
  input: {
    flex: 1,
    ...theme.textStyle('body'),
    color: theme.color.text.primary,
  },
  error: {
    ...theme.textStyle('label', { color: theme.color.danger.text }),
    marginTop: theme.space[1],
  },
});

export default FormInput;
