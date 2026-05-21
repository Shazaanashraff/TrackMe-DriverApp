import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import LoadingScreen from '../components/ui/LoadingScreen';

const TripHistoryScreen = ({ navigation }) => {
  const { authenticatedRequest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);

  const loadTrips = useCallback(async () => {
    try {
      const response = await authenticatedRequest(api.getDriverEarningsHistory, { page: 1, limit: 30 });
      setTrips(response.earnings || []);
    } catch (error) {
      console.error('Failed to load trip history:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedRequest]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  const renderTrip = useCallback(({ item }) => {
    const tripDate = new Date(item.journeyDate).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={styles.tripIconBox}>
            <Ionicons name="bus" size={20} color={COLORS.white} />
          </View>
          <View style={styles.tripTitleArea}>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.routeId?.source || 'Origin'} → {item.routeId?.destination || 'Destination'}
            </Text>
            <Text style={styles.dateText}>{tripDate}</Text>
          </View>
          <View style={[styles.statusBadge, item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending]}>
            <Text style={[styles.statusText, { color: item.paymentStatus === 'PAID' ? COLORS.primary : '#f59e0b' }]}>
              {item.paymentStatus || 'PENDING'}
            </Text>
          </View>
        </View>

        <View style={styles.tripBody}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>EARNINGS</Text>
            <Text style={styles.earningsValue}>₹{item.netEarnings || 0}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>PASSENGERS</Text>
            <Text style={styles.infoValue}>{item.totalPassengers || 0} Seats</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>BUS ID</Text>
            <Text style={styles.infoValue}>{item.busId?.busId || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.7}>
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }, []);

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Trip History" onBack={() => navigation.goBack()} />

      <FlatList
        data={trips}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderTrip}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No trip records found.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  tripIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  tripTitleArea: {
    flex: 1
  },
  routeText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  dateText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  statusBadge: {
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
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase'
  },
  tripBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border
  },
  infoCol: {
    flex: 1,
    alignItems: 'center'
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  earningsValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    gap: 6
  },
  detailsBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.primary
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 16
  }
});

export default TripHistoryScreen;
