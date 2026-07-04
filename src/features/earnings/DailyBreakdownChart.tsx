import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../helpers/formatters';
import { AppError } from '../../lib/errors';
import ErrorState from '../../components/ui/ErrorState';

export type DailyBreakdownItem = {
  _id: string;
  trips: number;
  passengers: number;
  earnings: number;
};

type Props = {
  breakdown: DailyBreakdownItem[];
  isLoading: boolean;
  isError: boolean;
  error?: AppError | null;
  onRetry: () => void;
};

export default function DailyBreakdownChart({ breakdown, isLoading, isError, error, onRetry }: Props) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <Text style={styles.loadingText}>Loading breakdown…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <ErrorState error={error ?? new AppError('unknown', 'Failed to load breakdown')} onRetry={onRetry} variant="compact" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily Breakdown</Text>

      {breakdown.length > 0 ? (
        <View style={styles.breakdownList}>
          {breakdown.map((day, idx) => (
            <View key={day._id ?? idx} style={styles.breakdownItem}>
              <View style={styles.breakdownDateBox}>
                <Text style={styles.breakdownDay}>{day._id.split('-')[2]}</Text>
                <Text style={styles.breakdownMonth}>
                  {new Date(day._id).toLocaleString('default', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.breakdownMain}>
                <Text style={styles.breakdownTrips}>
                  {day.trips} Trips • {day.passengers} Passengers
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min((day.earnings / 500) * 100, 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.breakdownValue}>{formatCurrency(day.earnings)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="calendar-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyHeading}>No Breakdown Available</Text>
          <Text style={styles.emptySub}>Complete more trips to see your daily analysis.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  breakdownList: {
    gap: SPACING.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownDateBox: {
    width: 45,
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  breakdownDay: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  breakdownMonth: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  breakdownMain: {
    flex: 1,
  },
  breakdownTrips: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginLeft: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHeading: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
