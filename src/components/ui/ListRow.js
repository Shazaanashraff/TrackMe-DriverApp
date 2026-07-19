import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from './AppText';

const ListRow = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  chevron = !!onPress,
  destructive = false,
  divider = false,
  testID,
  style,
}) => {
  const titleColor = destructive ? theme.color.danger.main : theme.color.text.primary;

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconBadge}>
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? theme.color.danger.main : theme.color.primary[500]}
          />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <AppText variant="body" color={titleColor} numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText variant="label" color={theme.color.text.muted} numberOfLines={1}>{subtitle}</AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" color={theme.color.text.secondary} style={styles.value}>{value}</AppText>
      ) : null}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={theme.color.text.muted} /> : null}
    </View>
  );

  if (!onPress) {
    return <View testID={testID} style={[divider && styles.divider, style]}>{content}</View>;
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [divider && styles.divider, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: theme.space[3],
  },
  pressed: {
    opacity: 0.7,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  value: {
    marginRight: theme.space[1],
  },
  divider: {
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.border.hairline,
  },
});

export default ListRow;
