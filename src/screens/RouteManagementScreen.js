import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { formatCurrency } from '../helpers/formatters';

const initialForm = {
  routeId: '',
  routeName: '',
  source: '',
  destination: '',
  distance: '',
  estimatedTime: '',
  fare: ''
};

const RouteManagementScreen = ({ navigation }) => {
  const { authenticatedRequest } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await authenticatedRequest(api.getRoutesManagementList);
      setRoutes(data);
    } catch (error) {
      if (error?.isBackendConnectionError) {
        return;
      }

      Alert.alert('Error', error.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [authenticatedRequest]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoutes();
    setRefreshing(false);
  }, [fetchRoutes]);

  const onChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.routeId.trim() &&
      form.routeName.trim() &&
      form.source.trim() &&
      form.destination.trim() &&
      Number(form.distance) > 0 &&
      Number(form.estimatedTime) > 0 &&
      Number(form.fare) >= 0
    );
  }, [form]);

  const handleCreateRoute = useCallback(async () => {
    if (!canSubmit) {
      Alert.alert('Validation', 'Please fill all required fields with valid values.');
      return;
    }

    try {
      setSubmitting(true);
      await authenticatedRequest(api.createRoute, {
        routeId: form.routeId.trim().toUpperCase(),
        routeName: form.routeName.trim(),
        source: form.source.trim(),
        destination: form.destination.trim(),
        distance: Number(form.distance),
        estimatedTime: Number(form.estimatedTime),
        fare: Number(form.fare),
        stopsCount: 0,
        stops: []
      });

      setForm(initialForm);
      await fetchRoutes();
      Alert.alert('Success', 'Route created successfully.');
    } catch (error) {
      if (error?.isBackendConnectionError) {
        return;
      }

      Alert.alert('Error', error.message || 'Failed to create route');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, fetchRoutes, form, authenticatedRequest]);

  const renderRoute = useCallback(({ item }) => {
    return (
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <View style={styles.routeIconBox}>
             <Ionicons name="map" size={20} color={COLORS.white} />
          </View>
          <View style={styles.routeTitleArea}>
            <Text style={styles.routeNameText}>{item.routeName}</Text>
            <Text style={styles.routeIdText}>{item.routeId}</Text>
          </View>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, { color: item.isActive ? COLORS.primary : COLORS.error }]}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.routePath}>
          <View style={styles.pathNode}>
             <View style={[styles.nodeDot, { backgroundColor: COLORS.primary }]} />
             <Text style={styles.pathText}>{item.source}</Text>
          </View>
          <View style={styles.pathLine} />
          <View style={styles.pathNode}>
             <View style={[styles.nodeDot, { backgroundColor: COLORS.error }]} />
             <Text style={styles.pathText}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.routeFooter}>
           <View style={styles.footerItem}>
              <Ionicons name="resize-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.footerValue}>{item.distance} km</Text>
           </View>
           <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.footerValue}>{item.estimatedTime} min</Text>
           </View>
           <View style={styles.footerItem}>
              <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.footerValue}>{formatCurrency(item.fare)}</Text>
           </View>
        </View>
      </View>
    );
  }, []);

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Route Management" onBack={() => navigation.goBack()} />

      <FlatList
        data={routes}
        keyExtractor={(item) => String(item._id || item.routeId)}
        renderItem={renderRoute}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Route</Text>
              
              <View style={styles.formGrid}>
                <View style={[styles.inputBox, { width: '48%' }]}>
                  <Text style={styles.label}>Route ID</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. R101" 
                    placeholderTextColor="#9ca3af" 
                    value={form.routeId} 
                    onChangeText={(v) => onChange('routeId', v)} 
                  />
                </View>
                <View style={[styles.inputBox, { width: '48%' }]}>
                  <Text style={styles.label}>Route Name</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Express Way" 
                    placeholderTextColor="#9ca3af" 
                    value={form.routeName} 
                    onChangeText={(v) => onChange('routeName', v)} 
                  />
                </View>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Source Location</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Starting point" 
                  placeholderTextColor="#9ca3af" 
                  value={form.source} 
                  onChangeText={(v) => onChange('source', v)} 
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Destination Location</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Endpoint" 
                  placeholderTextColor="#9ca3af" 
                  value={form.destination} 
                  onChangeText={(v) => onChange('destination', v)} 
                />
              </View>

              <View style={styles.formGrid}>
                <View style={[styles.inputBox, { width: '31%' }]}>
                  <Text style={styles.label}>Dist (km)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="0" 
                    placeholderTextColor="#9ca3af" 
                    keyboardType="numeric" 
                    value={form.distance} 
                    onChangeText={(v) => onChange('distance', v)} 
                  />
                </View>
                <View style={[styles.inputBox, { width: '31%' }]}>
                  <Text style={styles.label}>Time (min)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="0" 
                    placeholderTextColor="#9ca3af" 
                    keyboardType="numeric" 
                    value={form.estimatedTime} 
                    onChangeText={(v) => onChange('estimatedTime', v)} 
                  />
                </View>
                <View style={[styles.inputBox, { width: '31%' }]}>
                  <Text style={styles.label}>Fare ($)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="0" 
                    placeholderTextColor="#9ca3af" 
                    keyboardType="numeric" 
                    value={form.fare} 
                    onChangeText={(v) => onChange('fare', v)} 
                  />
                </View>
              </View>

              <PrimaryButton
                title="Register Route"
                onPress={handleCreateRoute}
                loading={submitting}
                disabled={!canSubmit}
                style={styles.submitButton}
              />
            </View>
            
            <View style={styles.listHeaderArea}>
               <Text style={styles.listTitle}>Existing Routes</Text>
               <View style={styles.countBadge}>
                 <Text style={styles.countText}>{routes.length}</Text>
               </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No routes found. Start by creating one!</Text>
          </View>
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
  formContainer: {
    marginBottom: SPACING.lg
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md
  },
  formTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.lg
  },
  formGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  inputBox: {
    marginBottom: SPACING.md
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 2
  },
  input: {
    backgroundColor: '#f9fafb',
    color: COLORS.text,
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.medium,
    fontSize: 14
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.sm,
    ...SHADOWS.md
  },
  listHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4
  },
  listTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  countBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10
  },
  countText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.bold
  },
  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  routeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  routeTitleArea: {
    flex: 1
  },
  routeNameText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  routeIdText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  activeBadge: {
    backgroundColor: `${COLORS.primary}20`
  },
  inactiveBadge: {
    backgroundColor: `${COLORS.error}20`
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.bold
  },
  routePath: {
    paddingVertical: SPACING.md,
    paddingHorizontal: 8,
    gap: 8
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  pathText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text
  },
  pathLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  footerValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center'
  },
});

export default RouteManagementScreen;
