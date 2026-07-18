import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { AppError, userMessage } from '../../lib/errors';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InlineError from '../../components/ui/InlineError';

export type NewRoutePayload = {
  routeId: string;
  routeName: string;
  source: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  fare: number;
  stopsCount: number;
  stops: unknown[];
};

const initialForm = {
  routeId: '',
  routeName: '',
  source: '',
  destination: '',
  distance: '',
  estimatedTime: '',
  fare: '',
};

type Props = {
  isSubmitting: boolean;
  error?: AppError | null;
  onSubmit: (payload: NewRoutePayload) => void;
};

export default function RouteForm({ isSubmitting, error, onSubmit }: Props) {
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!form.routeId.trim()) errors.routeId = 'Route ID is required';
    if (!form.routeName.trim()) errors.routeName = 'Route name is required';
    if (!form.source.trim()) errors.source = 'Source location is required';
    if (!form.destination.trim()) errors.destination = 'Destination is required';
    if (!(Number(form.distance) > 0)) errors.distance = 'Distance must be greater than 0';
    if (!(Number(form.estimatedTime) > 0)) errors.estimatedTime = 'Estimated time must be greater than 0';
    if (!(Number(form.fare) >= 0)) errors.fare = 'Fare must be 0 or greater';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      routeId: form.routeId.trim().toUpperCase(),
      routeName: form.routeName.trim(),
      source: form.source.trim(),
      destination: form.destination.trim(),
      distance: Number(form.distance),
      estimatedTime: Number(form.estimatedTime),
      fare: Number(form.fare),
      stopsCount: 0,
      stops: [],
    });
    setForm(initialForm);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add New Route</Text>

      <View style={styles.formGrid}>
        <View style={[styles.inputBox, { width: '48%' }]}>
          <Text style={styles.label}>Route ID</Text>
          <TextInput style={styles.input} placeholder="e.g. R101" placeholderTextColor="#9ca3af" value={form.routeId} onChangeText={(v) => onChange('routeId', v)} />
          <InlineError message={fieldErrors.routeId ?? null} />
        </View>
        <View style={[styles.inputBox, { width: '48%' }]}>
          <Text style={styles.label}>Route Name</Text>
          <TextInput style={styles.input} placeholder="Express Way" placeholderTextColor="#9ca3af" value={form.routeName} onChangeText={(v) => onChange('routeName', v)} />
          <InlineError message={fieldErrors.routeName ?? null} />
        </View>
      </View>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Source Location</Text>
        <TextInput style={styles.input} placeholder="Starting point" placeholderTextColor="#9ca3af" value={form.source} onChangeText={(v) => onChange('source', v)} />
        <InlineError message={fieldErrors.source ?? null} />
      </View>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Destination Location</Text>
        <TextInput style={styles.input} placeholder="Endpoint" placeholderTextColor="#9ca3af" value={form.destination} onChangeText={(v) => onChange('destination', v)} />
        <InlineError message={fieldErrors.destination ?? null} />
      </View>

      <View style={styles.formGrid}>
        <View style={[styles.inputBox, { width: '31%' }]}>
          <Text style={styles.label}>Dist (km)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="numeric" value={form.distance} onChangeText={(v) => onChange('distance', v)} />
          <InlineError message={fieldErrors.distance ?? null} />
        </View>
        <View style={[styles.inputBox, { width: '31%' }]}>
          <Text style={styles.label}>Time (min)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="numeric" value={form.estimatedTime} onChangeText={(v) => onChange('estimatedTime', v)} />
          <InlineError message={fieldErrors.estimatedTime ?? null} />
        </View>
        <View style={[styles.inputBox, { width: '31%' }]}>
          <Text style={styles.label}>Fare ($)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="numeric" value={form.fare} onChangeText={(v) => onChange('fare', v)} />
          <InlineError message={fieldErrors.fare ?? null} />
        </View>
      </View>

      {error && <InlineError message={userMessage(error)} />}

      <PrimaryButton title="Register Route" onPress={handleSubmit} loading={isSubmitting} style={styles.submitButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  formGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputBox: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
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
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
});
