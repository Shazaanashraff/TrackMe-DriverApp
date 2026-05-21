import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import LoadingScreen from '../components/ui/LoadingScreen';
import { formatCurrency } from '../helpers/formatters';

const DriverEarningsScreen = ({ navigation }) => {
  const { authenticatedRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, calendar

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsResponse, historyResponse, breakdownResponse] = await Promise.all([
        authenticatedRequest(api.getDriverEarningsStats),
        authenticatedRequest(api.getDriverEarningsHistory, { limit: 20 }),
        authenticatedRequest(api.getDriverDailyBreakdown)
      ]);

      setStats(statsResponse);
      setHistory(historyResponse.earnings || []);
      setDailyBreakdown(breakdownResponse.breakdown || []);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedRequest]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  }, [loadEarningsData]);

  const statCards = useMemo(() => [
    {
      title: 'Today',
      earnings: stats?.today?.totalEarnings || 0,
      trips: stats?.today?.totalTrips || 0,
      icon: 'today',
      color: COLORS.primary
    },
    {
      title: 'This Week',
      earnings: stats?.week?.totalEarnings || 0,
      trips: stats?.week?.totalTrips || 0,
      icon: 'stats-chart',
      color: '#3b82f6'
    },
    {
      title: 'This Month',
      earnings: stats?.month?.totalEarnings || 0,
      trips: stats?.month?.totalTrips || 0,
      icon: 'calendar',
      color: '#f59e0b'
    },
    {
      title: 'Pending',
      earnings: stats?.pending?.totalPending || 0,
      trips: stats?.pending?.count || 0,
      icon: 'time',
      color: '#8b5cf6'
    }
  ], [stats]);

  const renderStatCard = useCallback(({ title, earnings, trips, icon, color }) => (
    <View key={title} style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statAmount}>{formatCurrency(earnings)}</Text>
        <Text style={styles.statSubText}>{trips} completed trips</Text>
      </View>
      <View style={[styles.trendBadge, { backgroundColor: `${color}10` }]}>
        <Ionicons name="trending-up" size={12} color={color} />
      </View>
    </View>
  ), []);

  const renderOverviewTab = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance Summary</Text>
      </View>
      
      {statCards.map(card => renderStatCard(card))}

      {stats?.pending?.count > 0 && (
        <TouchableOpacity style={styles.payoutAction} activeOpacity={0.8}>
          <View style={styles.payoutIcon}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
          </View>
          <View style={styles.payoutBody}>
            <Text style={styles.payoutTitle}>Withdraw Earnings</Text>
            <Text style={styles.payoutSub}>{formatCurrency(stats.pending.totalPending)} available for payout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  ), [stats, statCards, renderStatCard]);

  const renderHistoryTab = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
      </View>
      
      {history.length > 0 ? (
        history.map((item, idx) => (
          <View key={idx} style={styles.historyCard}>
            <View style={styles.historyTop}>
               <View style={styles.historyIconBox}>
                  <Ionicons name="bus-outline" size={20} color={COLORS.secondary} />
               </View>
               <View style={styles.historyRouteInfo}>
                  <Text style={styles.historyRouteText} numberOfLines={1}>
                    {item.routeId?.source || 'Origin'} → {item.routeId?.destination || 'Dest'}
                  </Text>
                  <Text style={styles.historyDateText}>
                    {new Date(item.journeyDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
               </View>
               <Text style={styles.historyAmountText}>+{formatCurrency(item.netEarnings)}</Text>
            </View>
            <View style={styles.historyBottom}>
               <View style={[styles.statusTag, item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending]}>
                  <View style={[styles.statusDot, { backgroundColor: item.paymentStatus === 'PAID' ? COLORS.primary : '#f59e0b' }]} />
                  <Text style={[styles.statusTagText, { color: item.paymentStatus === 'PAID' ? COLORS.primary : '#f59e0b' }]}>
                    {item.paymentStatus}
                  </Text>
               </View>
               <Text style={styles.tripIdText}>Trip #{item._id?.slice(-6).toUpperCase()}</Text>
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
  ), [history]);

  const renderCalendarTab = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      </View>
      
      {dailyBreakdown.length > 0 ? (
        <View style={styles.breakdownList}>
          {dailyBreakdown.map((day, idx) => (
            <View key={idx} style={styles.breakdownItem}>
              <View style={styles.breakdownDateBox}>
                 <Text style={styles.breakdownDay}>{day._id.split('-')[2]}</Text>
                 <Text style={styles.breakdownMonth}>{new Date(day._id).toLocaleString('default', { month: 'short' })}</Text>
              </View>
              <View style={styles.breakdownMain}>
                 <Text style={styles.breakdownTrips}>{day.trips} Trips • {day.passengers} Passengers</Text>
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
  ), [dailyBreakdown]);

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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
           <Text style={styles.totalValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { id: 'overview', label: 'Overview', icon: 'grid' },
          { id: 'history', label: 'History', icon: 'list' },
          { id: 'calendar', label: 'Analysis', icon: 'analytics' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline`}
              size={18}
              color={activeTab === tab.id ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...SHADOWS.lg
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white
  },
  backBtn: {
    padding: 4
  },
  refreshBtn: {
    padding: 4
  },
  totalEarningsWrap: {
    alignItems: 'center',
    marginTop: 10
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4
  },
  totalValue: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    color: COLORS.white
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: -25,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
    padding: 4
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    position: 'relative'
  },
  tabItemActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2
  },
  scrollContent: {
    paddingBottom: 40
  },
  tabContent: {
    padding: SPACING.lg
  },
  sectionHeader: {
    marginBottom: SPACING.md
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  statIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  statInfo: {
    flex: 1
  },
  statTitle: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 2
  },
  statAmount: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  statSubText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  payoutAction: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  payoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  payoutBody: {
    flex: 1
  },
  payoutTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  payoutSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginTop: 2
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  historyRouteInfo: {
    flex: 1
  },
  historyRouteText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  historyDateText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  historyAmountText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusPaid: {
    backgroundColor: `${COLORS.primary}15`
  },
  statusPending: {
    backgroundColor: '#fef3c7'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusTagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase'
  },
  tripIdText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary
  },
  breakdownList: {
    gap: SPACING.sm
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  breakdownDateBox: {
    width: 45,
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.border
  },
  breakdownDay: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  breakdownMonth: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase'
  },
  breakdownMain: {
    flex: 1
  },
  breakdownTrips: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
    marginBottom: 6
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    width: '100%'
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2
  },
  breakdownValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginLeft: 16
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyHeading: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: 16
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40
  }
});

export default DriverEarningsScreen;
