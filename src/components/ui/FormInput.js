import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const FormInput = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  style,
  ...rest
}) => (
  <View style={[styles.group, style]}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={styles.wrapper}>
      {icon ? <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.icon} /> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#9ca3af"
        {...rest}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  group: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
});

export default FormInput;
