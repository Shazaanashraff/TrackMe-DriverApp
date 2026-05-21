import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionCard from '../components/ui/SectionCard';

const BusRegistrationScreen = ({ navigation }) => {
  const { authenticatedRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    busName: '',
    registrationNumber: '',
    seatCapacity: '',
    busType: 'AC',
    serviceType: 'PUBLIC',
    bookingEnabled: true
  });
  const [errors, setErrors] = useState({});

  const busTypes = ['AC', 'NON-AC', 'DELUXE', 'SLEEPER'];
  const serviceTypes = ['PUBLIC', 'SCHOOL', 'OFFICE'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.busId.trim()) newErrors.busId = 'Bus ID is required';
    if (!formData.busName.trim()) newErrors.busName = 'Bus name is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Reg number is required';
    if (!formData.seatCapacity.trim()) {
      newErrors.seatCapacity = 'Seat capacity is required';
    } else if (isNaN(formData.seatCapacity) || parseInt(formData.seatCapacity) < 1) {
      newErrors.seatCapacity = 'Invalid capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterBus = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete the form correctly');
      return;
    }

    setLoading(true);
    try {
      const busData = {
        busId: formData.busId.toUpperCase().trim(),
        busName: formData.busName.trim(),
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        seatCapacity: parseInt(formData.seatCapacity),
        busType: formData.busType,
        serviceType: formData.serviceType,
        bookingEnabled: formData.bookingEnabled
      };

      const response = await authenticatedRequest(api.registerBus, busData);

      if (response.success) {
        Alert.alert('Success', 'Bus registered successfully!', [
          { text: 'Great!', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to register bus');
      }
    } catch (error) {
      if (error?.isBackendConnectionError) {
        return;
      }

      Alert.alert('Registration Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const renderSelect = (options, current, field) => (
    <View style={styles.chipContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, current === opt && styles.chipActive]}
          onPress={() => handleInputChange(field, opt)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, current === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScreenHeader title="Vehicle Registration" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SectionCard title="Basic Details" style={styles.formCard}>
            <FormInput
              label="Bus Identifier"
              icon="finger-print"
              value={formData.busId}
              onChangeText={(v) => handleInputChange('busId', v)}
              placeholder="e.g. BUS-102"
              autoCapitalize="characters"
              style={styles.inputSpacing}
            />
            {errors.busId ? <Text style={styles.errorText}>{errors.busId}</Text> : null}

            <FormInput
              label="Vehicle Name"
              icon="bus"
              value={formData.busName}
              onChangeText={(v) => handleInputChange('busName', v)}
              placeholder="e.g. Silver Express"
              style={styles.inputSpacing}
            />
            {errors.busName ? <Text style={styles.errorText}>{errors.busName}</Text> : null}

            <FormInput
              label="Registration No."
              icon="reader"
              value={formData.registrationNumber}
              onChangeText={(v) => handleInputChange('registrationNumber', v)}
              placeholder="e.g. ABC-1234"
              autoCapitalize="characters"
              style={styles.inputSpacing}
            />
            {errors.registrationNumber ? <Text style={styles.errorText}>{errors.registrationNumber}</Text> : null}

            <FormInput
              label="Seats"
              value={formData.seatCapacity}
              onChangeText={(v) => handleInputChange('seatCapacity', v)}
              placeholder="50"
              keyboardType="numeric"
            />
            {errors.seatCapacity ? <Text style={styles.errorText}>{errors.seatCapacity}</Text> : null}
          </SectionCard>

          <SectionCard title="Specifications" style={styles.formCard}>
            <View style={styles.specGroup}>
              <Text style={styles.specLabel}>Bus Category</Text>
              {renderSelect(busTypes, formData.busType, 'busType')}
            </View>

            <View style={styles.specGroup}>
              <Text style={styles.specLabel}>Service Area</Text>
              {renderSelect(serviceTypes, formData.serviceType, 'serviceType')}
            </View>

            <View style={styles.switchBox}>
              <View>
                <Text style={styles.switchTitle}>Enable Booking</Text>
                <Text style={styles.switchSub}>Allow users to book seats online</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleWrap, formData.bookingEnabled ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => handleInputChange('bookingEnabled', !formData.bookingEnabled)}
              >
                <View style={[styles.toggleCircle, formData.bookingEnabled ? styles.circleRight : styles.circleLeft]} />
              </TouchableOpacity>
            </View>
          </SectionCard>

          <PrimaryButton
            title="Register Vehicle"
            onPress={handleRegisterBus}
            loading={loading}
            style={styles.submitButton}
          />

          <View style={styles.noteBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.noteText}>Make sure all details match your vehicle registration documents.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  formCard: {
    padding: SPACING.lg
  },
  inputSpacing: {
    marginBottom: 4
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
    marginBottom: SPACING.md,
    marginLeft: 4
  },
  specGroup: {
    marginBottom: SPACING.md
  },
  specLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  chipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary
  },
  chipTextActive: {
    color: COLORS.white
  },
  switchBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm
  },
  switchTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  switchSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  toggleWrap: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center'
  },
  toggleActive: {
    backgroundColor: COLORS.primary
  },
  toggleInactive: {
    backgroundColor: COLORS.border
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm
  },
  circleLeft: {
    alignSelf: 'flex-start'
  },
  circleRight: {
    alignSelf: 'flex-end'
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
    ...SHADOWS.md
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    padding: 16,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    gap: 12
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    lineHeight: 18
  }
});

export default BusRegistrationScreen;
