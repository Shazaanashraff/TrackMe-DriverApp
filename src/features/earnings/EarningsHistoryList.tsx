import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatCurrency } from '../../helpers/formatters';
import { AppError } from '../../lib/errors';
import ErrorState from '../../components/ui/ErrorState';

export type EarningHistoryItem = {
  _id?: string;
  routeId?: { source?: string; destination?: string };
  journeyDate: string;
  netEarnings: number;
  paymentStatus: 'PENDING' | 'PROCESSED' | 'PAID' | 'FAILED';
};

type Props = {
  history: EarningHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  error?: AppError | null;
  onRetry: () => void;
  onRequestPayout: (item: EarningHistoryItem) => void;
};

export default function EarningsHistoryList({
  history,
  isLoading,
  isError,
  error,
  onRetry,
  onRequestPayout,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Text style={styles.loadingText}>Loading history…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <ErrorState error={error ?? new AppError('unknown', 'Failed to load history')} onRetry={onRetry} variant="compact" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Transaction History</Text>

      {history.length > 0 ? (
        history.map((item, idx) => (
          <View key={item._id ?? idx} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <View style={styles.historyIconBox}>
                <Ionicons name="bus-outline" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.historyRouteInfo}>
                <Text style={styles.historyRouteText} numberOfLines={1}>
                  {item.routeId?.source || 'Origin'} → {item.routeId?.destination || 'Dest'}
                </Text>
                <Text style={styles.historyDateText}>
                  {new Date(item.journeyDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.historyAmountText}>+{formatCurrency(item.netEarnings)}</Text>
            </View>
            <View style={styles.historyBottom}>
              <View style={[styles.statusTag, item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.paymentStatus === 'PAID' ? COLORS.primary : '#f59e0b' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusTagText,
                    { color: item.paymentStatus === 'PAID' ? COLORS.primary : '#f59e0b' },
                  ]}
                >
                  {item.paymentStatus}
                </Text>
              </View>
              {item.paymentStatus === 'PENDING' ? (
                <TouchableOpacity onPress={() => onRequestPayout(item)}>
                  <Text style={styles.requestPayoutText}>Request Payout</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.tripIdText}>Trip #{item._id?.slice(-6).toUpperCase()}</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyHeading}>No History Yet</Text>
          <Text style={styles.emptySub}>Your earnings history will appear here after your first trip.</Text>
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
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyRouteInfo: {
    flex: 1,
  },
  historyRouteText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  historyDateText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyAmountText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: `${COLORS.primary}15`,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  tripIdText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  requestPayoutText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
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
