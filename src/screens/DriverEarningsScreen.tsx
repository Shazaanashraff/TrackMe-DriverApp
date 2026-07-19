import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, SafeAreaView, StatusBar, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import OfflineBanner from '../components/ui/OfflineBanner';
import { formatCurrency } from '../helpers/formatters';
import { AppError, normalizeError } from '../lib/errors';
import { useEarningsStatsQuery, useEarningsHistoryQuery, useDailyBreakdownQuery, useRequestPayout } from '../hooks/earnings';
import EarningsSummary from '../features/earnings/EarningsSummary';
import EarningsHistoryList, { EarningHistoryItem } from '../features/earnings/EarningsHistoryList';
import DailyBreakdownChart from '../features/earnings/DailyBreakdownChart';
import PayoutRequestForm, { BankAccount } from '../features/earnings/PayoutRequestForm';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

const SEGMENTS = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
] as const;

const DriverEarningsScreen = () => {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]['id']>('summary');
  const [refreshing, setRefreshing] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<EarningHistoryItem | null>(null);

  const statsQuery = useEarningsStatsQuery();
  const historyQuery = useEarningsHistoryQuery(1, 20);
  const breakdownQuery = useDailyBreakdownQuery();
  const payout = useRequestPayout();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([statsQuery.refetch(), historyQuery.refetch(), breakdownQuery.refetch()]);
    setRefreshing(false);
  };

  const handleSubmitPayout = (bankAccount: BankAccount) => {
    if (!payoutTarget?._id) return;
    payout.mutate(
      { earningId: payoutTarget._id, bankAccount },
      { onSuccess: () => setPayoutTarget(null) }
    );
  };

  const history = (historyQuery.data as { earnings?: EarningHistoryItem[] })?.earnings || [];
  const breakdown = (breakdownQuery.data as { breakdown?: [] })?.breakdown || [];
  const monthTotal = (statsQuery.data as { month?: { totalEarnings?: number } })?.month?.totalEarnings || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.primary[500]} />
        }
      >
        <AppText variant="h1" style={styles.title}>Earnings</AppText>

        <Card style={styles.balanceCard}>
          <AppText variant="overline" color={theme.color.text.muted}>You've earned</AppText>
          {statsQuery.isLoading ? (
            <Skeleton width={160} height={41} style={styles.balanceSkeleton} />
          ) : (
            <AppText variant="display">{formatCurrency(monthTotal)}</AppText>
          )}
          <AppText variant="label" color={theme.color.text.muted}>this month</AppText>
        </Card>

        <View style={styles.segmentTrack}>
          {SEGMENTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSegment(s.id)}
              style={[styles.segment, segment === s.id && styles.segmentActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: segment === s.id }}
            >
              <AppText
                variant="label"
                weight="medium"
                color={segment === s.id ? theme.color.text.primary : theme.color.text.secondary}
              >
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {segment === 'summary' ? (
          <View style={styles.segmentContent}>
            <EarningsSummary stats={statsQuery.data as never} isLoading={statsQuery.isLoading} />
            <DailyBreakdownChart
              breakdown={breakdown}
              isLoading={breakdownQuery.isLoading}
              isError={breakdownQuery.isError}
              error={breakdownQuery.error ? asAppError(breakdownQuery.error) : null}
              onRetry={() => breakdownQuery.refetch()}
            />
          </View>
        ) : (
          <View style={styles.segmentContent}>
            <EarningsHistoryList
              history={history}
              isLoading={historyQuery.isLoading}
              isError={historyQuery.isError}
              error={historyQuery.error ? asAppError(historyQuery.error) : null}
              onRetry={() => historyQuery.refetch()}
              onRequestPayout={setPayoutTarget}
            />
          </View>
        )}
      </ScrollView>

      <PayoutRequestForm
        visible={!!payoutTarget}
        earningAmount={payoutTarget?.netEarnings || 0}
        isSubmitting={payout.isPending}
        error={payout.isError ? asAppError(payout.error) : null}
        onCancel={() => setPayoutTarget(null)}
        onSubmit={handleSubmitPayout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  scrollContent: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  title: {
    marginBottom: theme.space[3],
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: theme.space[4],
  },
  balanceSkeleton: {
    marginTop: theme.space[2],
    marginBottom: theme.space[2],
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.control,
    padding: 4,
    marginBottom: theme.space[4],
  },
  segment: {
    flex: 1,
    paddingVertical: theme.space[2],
    alignItems: 'center',
    borderRadius: theme.radius.control - 2,
  },
  segmentActive: {
    backgroundColor: theme.color.surface.card,
  },
  segmentContent: {
    gap: theme.space[3],
  },
});

export default DriverEarningsScreen;
