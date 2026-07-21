import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { useBoardingRosterQuery } from '../../hooks/boarding';

type Props = {
  busId: string;
  onPress: () => void;
};

// Home-screen "X / Y on board" card. Y = riders enrolled on the bus's route. Tapping opens
// the full roster page. Hidden entirely when the route isn't QR-enabled (the query errors)
// so it never shows a broken/zero card on ordinary public routes.
export default function OnBoardCard({ busId, onPress }: Props) {
  const { data, isLoading, isError } = useBoardingRosterQuery(busId);

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Ionicons name="people-outline" size={20} color={theme.color.primary[500]} />
          </View>
          <View style={styles.textBlock}>
            <AppText variant="body">On board</AppText>
            <Skeleton width={80} height={12} style={styles.skeleton} testID="on-board-skeleton" />
          </View>
        </View>
      </Card>
    );
  }

  const { onBoardCount, enrolledCount } = data;
  const hasEnrolled = enrolledCount > 0;

  const content = (
    <View style={styles.row}>
      <View style={styles.iconBadge}>
        <Ionicons name="people" size={20} color={theme.color.primary[500]} />
      </View>
      <View style={styles.textBlock}>
        <AppText variant="body">On board</AppText>
        <AppText variant="label" color={theme.color.text.muted}>
          {hasEnrolled ? 'Enrolled riders on this route' : 'No enrolled riders yet'}
        </AppText>
      </View>
      {hasEnrolled ? (
        <AppText variant="h2" weight="medium" color={theme.color.primary[500]} style={styles.count}>
          {`${onBoardCount} / ${enrolledCount}`}
        </AppText>
      ) : null}
      {hasEnrolled ? (
        <Ionicons name="chevron-forward" size={18} color={theme.color.text.muted} />
      ) : null}
    </View>
  );

  if (!hasEnrolled) {
    return (
      <Card style={styles.card} testID="on-board-card">
        {content}
      </Card>
    );
  }

  return (
    <Card style={styles.card} padding={0} testID="on-board-card">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`On board: ${onBoardCount} of ${enrolledCount} enrolled riders`}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        testID="on-board-card-pressable"
      >
        {content}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.space[4],
  },
  pressable: {
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: theme.space[3],
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
  count: {
    marginRight: theme.space[1],
  },
  skeleton: {
    marginTop: theme.space[1],
  },
});
