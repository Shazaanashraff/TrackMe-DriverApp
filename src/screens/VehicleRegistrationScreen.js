import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useRegisterVehicle } from '../hooks/vehicle';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import ScreenHeader from '../components/ui/ScreenHeader';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import Card from '../components/ui/Card';
import StatusPill from '../components/ui/StatusPill';
import InlineError from '../components/ui/InlineError';

const VEHICLE_TYPES = ['AC', 'NON-AC', 'DELUXE', 'SLEEPER'];
const SERVICE_TYPES = ['PUBLIC', 'SCHOOL', 'OFFICE'];

const VehicleRegistrationScreen = ({ navigation }) => {
  const registerVehicle = useRegisterVehicle();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleName: '',
    registrationNumber: '',
    vehicleType: 'AC',
    serviceType: 'PUBLIC',
    bookingEnabled: true,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId.trim()) newErrors.vehicleId = 'Vehicle ID is required';
    if (!formData.vehicleName.trim()) newErrors.vehicleName = 'Vehicle name is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterVehicle = async () => {
    setFormError(null);
    setSaved(false);
    if (!validateForm()) return;

    setLoading(true);
    try {
      const vehicleData = {
        vehicleId: formData.vehicleId.toUpperCase().trim(),
        vehicleName: formData.vehicleName.trim(),
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        vehicleType: formData.vehicleType,
        serviceType: formData.serviceType,
        bookingEnabled: formData.bookingEnabled,
      };

      const response = await registerVehicle.mutateAsync(vehicleData);

      if (response.success) {
        setSaved(true);
        setTimeout(() => navigation.goBack(), 700);
      } else {
        setFormError(response.message || "Couldn't save your vehicle. Try again.");
      }
    } catch (error) {
      if (error?.isBackendConnectionError) {
        return;
      }
      setFormError(error.message || "Couldn't save your vehicle. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const renderChips = (options, current, field) => (
    <View style={styles.chipContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, current === opt && styles.chipActive]}
          onPress={() => handleInputChange(field, opt)}
          activeOpacity={0.7}
        >
          <AppText
            variant="caption"
            weight="medium"
            color={current === opt ? theme.color.white : theme.color.text.secondary}
          >
            {opt}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScreenHeader title="Your vehicle" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card>
            <FormInput
              label="Vehicle ID"
              icon="finger-print"
              value={formData.vehicleId}
              onChangeText={(v) => handleInputChange('vehicleId', v)}
              placeholder="e.g. VEHICLE-102"
              autoCapitalize="characters"
              error={errors.vehicleId}
            />
            <FormInput
              label="Vehicle name"
              icon="bus"
              value={formData.vehicleName}
              onChangeText={(v) => handleInputChange('vehicleName', v)}
              placeholder="e.g. Silver Express"
              error={errors.vehicleName}
            />
            <FormInput
              label="Registration number"
              icon="reader"
              value={formData.registrationNumber}
              onChangeText={(v) => handleInputChange('registrationNumber', v)}
              placeholder="e.g. ABC-1234"
              autoCapitalize="characters"
              error={errors.registrationNumber}
            />

            <View style={styles.specGroup}>
              <AppText variant="label" color={theme.color.text.secondary} style={styles.specLabel}>
                Vehicle category
              </AppText>
              {renderChips(VEHICLE_TYPES, formData.vehicleType, 'vehicleType')}
            </View>

            <View style={styles.specGroup}>
              <AppText variant="label" color={theme.color.text.secondary} style={styles.specLabel}>
                Service area
              </AppText>
              {renderChips(SERVICE_TYPES, formData.serviceType, 'serviceType')}
            </View>

            <View style={styles.switchBox}>
              <View style={styles.switchTextBlock}>
                <AppText variant="body" weight="medium">Enable booking</AppText>
                <AppText variant="caption" color={theme.color.text.muted}>Allow riders to book seats online</AppText>
              </View>
              <TouchableOpacity
                style={[styles.toggleWrap, formData.bookingEnabled ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => handleInputChange('bookingEnabled', !formData.bookingEnabled)}
                accessibilityRole="switch"
                accessibilityState={{ checked: formData.bookingEnabled }}
              >
                <View style={[styles.toggleCircle, formData.bookingEnabled ? styles.circleRight : styles.circleLeft]} />
              </TouchableOpacity>
            </View>
          </Card>

          {saved ? (
            <View style={styles.savedRow}>
              <StatusPill label="Saved" variant="live" />
            </View>
          ) : null}
          <InlineError message={formError} />

          <PrimaryButton title="Save vehicle" onPress={handleRegisterVehicle} loading={loading} style={styles.submitButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  specGroup: {
    marginTop: theme.space[4],
  },
  specLabel: {
    marginBottom: theme.space[2],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  chip: {
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.field,
  },
  chipActive: {
    backgroundColor: theme.color.primary[500],
  },
  switchBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.space[4],
    marginTop: theme.space[4],
    borderTopWidth: theme.borderWidth.hairline,
    borderTopColor: theme.color.border.hairline,
  },
  switchTextBlock: {
    flex: 1,
    marginRight: theme.space[3],
  },
  toggleWrap: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.color.primary[500],
  },
  toggleInactive: {
    backgroundColor: theme.color.border.strong,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.color.white,
  },
  circleLeft: {
    alignSelf: 'flex-start',
  },
  circleRight: {
    alignSelf: 'flex-end',
  },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.space[4],
  },
  submitButton: {
    marginTop: theme.space[4],
  },
});

export default VehicleRegistrationScreen;
