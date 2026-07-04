import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { CopilotProvider } from 'react-native-copilot';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { connectSocket, emitLocation, startTracking as startTrackingSession, stopTracking, disconnectSocket } from '../services/socket';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getConnectionState, onConnectionStateChange } from '../services/socket';
import ShiftBusIcon from '../components/ShiftBusIcon';
import CustomRouteRecorder from '../components/CustomRouteRecorder';

const DriverDashboard = ({ navigation }) => {
  const { user, token, logout, authenticatedRequest } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [bus, setBus] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [customRoute, setCustomRoute] = useState(null);
  const [showUpdateRecorder, setShowUpdateRecorder] = useState(false);
  const locationSubscription = useRef(null);
  const journeyBreadcrumbRef = useRef([]);
    const [socketState, setSocketState] = useState(getConnectionState());

  useEffect(() => {
    loadBusInfo();
    loadCustomRouteInfo();
    if (token) {
      connectSocket(token);
    }
      const unsubscribe = onConnectionStateChange((newState) => {
        setSocketState(newState);
      });

    return () => {
        unsubscribe();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      disconnectSocket();
    };
  }, [token]);

  const loadBusInfo = async () => {
    try {
      const busData = await authenticatedRequest(api.getMyBus);
      setBus(busData.data || busData);
    } catch (error) {
      console.log('No bus assigned');
    }
  };

  const loadCustomRouteInfo = async () => {
    try {
      const res = await authenticatedRequest(api.getMyCustomRoute);
      setCustomRoute(res.data || res);
    } catch (error) {
      setCustomRoute(null);
    }
  };

  // A custom-route driver whose route hasn't been recorded+named yet gets the
  // map-free recorder instead of the normal Start/Stop Journey card.
  const isPendingCustomRoute = customRoute?.isCustomRoute && customRoute?.status === 'PENDING_NAMING';
  const isRecordedAwaitingNaming = isPendingCustomRoute && (customRoute?.stopsCount || 0) > 0;
  // An ACTIVE custom route uses the normal journey flow, but every journey's
  // breadcrumb is reported for off-route detection (Phase 2).
  const isActiveCustomRoute = customRoute?.isCustomRoute && customRoute?.status === 'ACTIVE';

  const startTracking = async () => {
    if (!bus) {
      Alert.alert('Error', 'No bus assigned to you');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
      return;
    }

    const trackingResponse = await startTrackingSession(bus.busId || bus._id);
    if (!trackingResponse?.success) {
      Alert.alert('Tracking Error', trackingResponse?.error || 'Failed to start tracking on server');
      return;
    }

    setIsTracking(true);
    journeyBreadcrumbRef.current = [];

    try {
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = initial.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      if (isActiveCustomRoute) journeyBreadcrumbRef.current.push({ lat: latitude, lng: longitude });
      emitLocation(
        bus.busId || bus._id,
        bus.routeId || bus.assignedRoute,
        latitude,
        longitude,
        (response) => {
          if (response?.success === false) {
            console.warn('Initial location update rejected:', response.error || response);
          }
        }
      );
    } catch (error) {
      console.warn('Failed to fetch initial location:', error?.message || error);
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 3
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        if (isActiveCustomRoute) journeyBreadcrumbRef.current.push({ lat: latitude, lng: longitude });
        emitLocation(
          bus.busId || bus._id,
          bus.routeId || bus.assignedRoute,
          latitude,
          longitude,
          (response) => {
            if (response?.success === false) {
              console.warn('Location update rejected:', response.error || response);
            }
          }
        );
      }
    );
  };

  const reportCompletedJourney = async () => {
    if (!isActiveCustomRoute || journeyBreadcrumbRef.current.length < 2) return;
    try {
      const res = await authenticatedRequest(api.reportJourney, {
        routeId: customRoute.routeId,
        busId: bus.busId || bus._id,
        breadcrumb: journeyBreadcrumbRef.current
      });
      if ((res.data || res)?.flagged) {
        loadCustomRouteInfo();
      }
    } catch (error) {
      console.log('Failed to report journey for off-route detection:', error?.message || error);
    }
  };

  const handleStopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (bus) {
      stopTracking(bus.busId || bus._id);
    }
    reportCompletedJourney();
    journeyBreadcrumbRef.current = [];
    setIsTracking(false);
    setCurrentLocation(null);
  };

  const executeLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      handleStopTracking();
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error('Logout failed:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <View style={styles.logoWordmark}>
            <ShiftBusIcon size={30} style={styles.logoWordmarkIcon} />
            <Text style={styles.logoText}>TrackMe</Text>
          </View>
          <Text style={styles.greetingText}>Welcome back, {user?.name || 'Driver'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBadge} onPress={() => navigation.navigate('DriverProfile')}>
          <Ionicons name="person-circle" size={40} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        
        {/* Active Journey Status / Custom Route Recorder */}
        {isRecordedAwaitingNaming ? (
          <View style={styles.mainCard} testID="custom-route-pending-naming">
            <View style={styles.statusHeader}>
              <View style={styles.statusIndicator}>
                <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.statusLabel}>Awaiting manager naming</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>
              Your recorded route ({customRoute.stopsCount} stops, {customRoute.distance ?? 0} km) has been sent to your manager. You'll be able to start journeys once it's named.
            </Text>
          </View>
        ) : isPendingCustomRoute ? (
          <CopilotProvider>
            <CustomRouteRecorder bus={bus} onSubmitted={loadCustomRouteInfo} />
          </CopilotProvider>
        ) : showUpdateRecorder ? (
          <CopilotProvider>
            <CustomRouteRecorder
              bus={bus}
              routeId={customRoute.routeId}
              mode="update"
              onSubmitted={() => { setShowUpdateRecorder(false); loadCustomRouteInfo(); }}
            />
          </CopilotProvider>
        ) : (
          <View style={[styles.mainCard, isTracking && styles.activeCardBorder]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIndicator}>
                <View style={[styles.pulseDot, isTracking ? styles.pulseDotActive : styles.pulseDotInactive]} />
                  <Text style={styles.statusLabel}>
                    {isTracking ? 'Currently On Journey' : socketState.status === 'connecting' ? 'Connecting to server...' : 'Standby Mode'}
                  </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: isTracking ? `${COLORS.primary}20` : '#f3f4f6' }]}>
                 <Text style={[styles.typeText, { color: isTracking ? COLORS.primary : COLORS.textSecondary }]}>
                   {isTracking ? 'Live' : 'Offline'}
                 </Text>
              </View>
            </View>

            {isTracking && currentLocation && (
              <View style={styles.locationContainer}>
                 <View style={styles.locationIconWrap}>
                   <Ionicons name="location" size={24} color={COLORS.primary} />
                 </View>
                 <View>
                   <Text style={styles.coordLabel}>Current Coordinates</Text>
                   <Text style={styles.coordValue}>{currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</Text>
                 </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isTracking ? styles.stopButton : styles.startButton,
                (!bus && !isTracking) && styles.disabledButton
              ]}
              onPress={isTracking ? handleStopTracking : startTracking}
              disabled={!bus && !isTracking}
              activeOpacity={0.9}
            >
              <Ionicons
                name={isTracking ? "stop-circle" : "play-circle"}
                size={24}
                color={COLORS.white}
                style={styles.buttonIcon}
              />
              <Text style={styles.actionButtonText}>
                {isTracking ? 'End Journey' : 'Start Journey'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isActiveCustomRoute && customRoute?.hasPendingChangeRequest && !showUpdateRecorder && (
          <View style={styles.updateRouteBanner} testID="update-route-banner">
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.primary} />
            <View style={styles.updateRouteTextWrap}>
              <Text style={styles.updateRouteTitle}>Route may have changed</Text>
              <Text style={styles.updateRouteSubtitle}>Re-record your route so your manager can review the update.</Text>
            </View>
            <TouchableOpacity
              style={styles.updateRouteButton}
              onPress={() => setShowUpdateRecorder(true)}
              testID="update-route-button"
            >
              <Text style={styles.updateRouteButtonText}>Update Route</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bus Info Section */}
        <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
        {bus ? (
          <View style={styles.busCard}>
            <View style={styles.busHeader}>
              <View style={styles.busIconContainer}>
                <Ionicons name="bus" size={24} color={COLORS.white} />
              </View>
              <View style={styles.busTitleArea}>
                <Text style={styles.busName}>{bus.busName}</Text>
                <Text style={styles.busReg}>{bus.registrationNumber || 'No Registration'}</Text>
              </View>
            </View>
            
            <View style={styles.busMetaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                <Text style={styles.metaText}>{bus.seatCapacity || 0} Seats</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyBusCard} onPress={() => navigation.navigate('BusRegistration')}>
            <Ionicons name="add-circle-outline" size={32} color={COLORS.textSecondary} />
            <Text style={styles.emptyBusText}>No bus assigned. Tap to register.</Text>
          </TouchableOpacity>
        )}

        {/* Quick Menu */}
        <Text style={styles.sectionTitle}>Dashboard Menu</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('DriverEarnings')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="wallet" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.menuLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('TripHistory')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="time" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.menuLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={handleLogout}>
            <View style={[styles.menuIconBox, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="log-out" size={22} color={COLORS.error} />
            </View>
            <Text style={styles.menuLabel}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </View>
            <Text style={styles.logoutModalTitle}>Log out?</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to logout from your driver account?
            </Text>

            <View style={styles.logoutActionsRow}>
              <TouchableOpacity
                style={[styles.logoutActionButton, styles.logoutCancelButton]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutActionButton, styles.logoutConfirmButton, isLoggingOut && styles.logoutConfirmButtonDisabled]}
                onPress={executeLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutConfirmText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm
  },
  logoText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    letterSpacing: -0.5
  },
  logoWordmark: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoWordmarkIcon: {
    marginRight: 8
  },
  greetingText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  profileBadge: {
    padding: 4
  },
  content: {
    flex: 1
  },
  scrollPadding: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md
  },
  activeCardBorder: {
    borderColor: COLORS.primary,
    borderWidth: 2
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  pulseDotActive: {
    backgroundColor: COLORS.primary,
  },
  pulseDotInactive: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  updateRouteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10
  },
  updateRouteTextWrap: {
    flex: 1
  },
  updateRouteTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  updateRouteSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  updateRouteButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  updateRouteButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.white
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },
  typeText: {
    fontSize: 12,
    fontFamily: FONTS.bold
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...SHADOWS.sm
  },
  coordLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase'
  },
  coordValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  actionButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md
  },
  startButton: {
    backgroundColor: COLORS.secondary,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  buttonIcon: {
    marginRight: 10
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm
  },
  busCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  busIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  busTitleArea: {
    flex: 1
  },
  busName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  busReg: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary
  },
  busMetaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    gap: 20
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metaText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.secondary
  },
  emptyBusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg
  },
  emptyBusText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 10
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  menuCard: {
    width: '31.5%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  menuIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md
  },
  logoutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  logoutModalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: 6
  },
  logoutModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg
  },
  logoutActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  logoutActionButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutCancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  logoutConfirmButton: {
    backgroundColor: COLORS.error
  },
  logoutConfirmButtonDisabled: {
    opacity: 0.65
  },
  logoutCancelText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  logoutConfirmText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white
  }
});

export default DriverDashboard;
