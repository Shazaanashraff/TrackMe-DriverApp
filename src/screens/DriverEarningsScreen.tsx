import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatCurrency } from '../helpers/formatters';
import { AppError, normalizeError } from '../lib/errors';
import { useEarningsStatsQuery, useEarningsHistoryQuery, useDailyBreakdownQuery, useRequestPayout } from '../hooks/earnings';
import LoadingScreen from '../components/ui/LoadingScreen';
import OfflineBanner from '../components/ui/OfflineBanner';
import EarningsSummary from '../features/earnings/EarningsSummary';
import EarningsHistoryList, { EarningHistoryItem } from '../features/earnings/EarningsHistoryList';
import DailyBreakdownChart from '../features/earnings/DailyBreakdownChart';
import PayoutRequestForm, { BankAccount } from '../features/earnings/PayoutRequestForm';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

type Props = {
  navigation: { goBack: () => void };
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'history', label: 'History', icon: 'list' },
  { id: 'calendar', label: 'Analysis', icon: 'analytics' },
] as const;

const DriverEarningsScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('overview');
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

  if (statsQuery.isLoading && historyQuery.isLoading && breakdownQuery.isLoading) {
    return <LoadingScreen />;
  }

  const history = (historyQuery.data as { earnings?: EarningHistoryItem[] })?.earnings || [];
  const breakdown = (breakdownQuery.data as { breakdown?: [] })?.breakdown || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <OfflineBanner />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.totalEarningsWrap}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalValue}>
            {formatCurrency((statsQuery.data as { totalEarnings?: number })?.totalEarnings || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === tab.id ? tab.icon : (`${tab.icon}-outline` as typeof tab.icon)}
              size={18}
              color={activeTab === tab.id ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {activeTab === 'overview' && <EarningsSummary stats={statsQuery.data as never} />}
        {activeTab === 'history' && (
          <EarningsHistoryList
            history={history}
            isLoading={historyQuery.isLoading}
            isError={historyQuery.isError}
            error={historyQuery.error ? asAppError(historyQuery.error) : null}
            onRetry={() => historyQuery.refetch()}
            onRequestPayout={setPayoutTarget}
          />
        )}
        {activeTab === 'calendar' && (
          <DailyBreakdownChart
            breakdown={breakdown}
            isLoading={breakdownQuery.isLoading}
            isError={breakdownQuery.isError}
            error={breakdownQuery.error ? asAppError(breakdownQuery.error) : null}
            onRetry={() => breakdownQuery.refetch()}
          />
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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  backBtn: {
    padding: 4,
  },
  refreshBtn: {
    padding: 4,
  },
  totalEarningsWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: -25,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default DriverEarningsScreen;
