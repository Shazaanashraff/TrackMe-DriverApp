import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { AppError, userMessage } from '../../lib/errors';
import Card from '../../components/ui/Card';
import FormInput from '../../components/ui/FormInput';
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
    <Card title="Add a route">
      <View style={styles.row}>
        <FormInput
          label="Route ID"
          placeholder="e.g. R101"
          value={form.routeId}
          onChangeText={(v) => onChange('routeId', v)}
          error={fieldErrors.routeId}
          style={styles.half}
        />
        <FormInput
          label="Route name"
          placeholder="Express Way"
          value={form.routeName}
          onChangeText={(v) => onChange('routeName', v)}
          error={fieldErrors.routeName}
          style={styles.half}
        />
      </View>

      <FormInput
        label="Source location"
        placeholder="Starting point"
        value={form.source}
        onChangeText={(v) => onChange('source', v)}
        error={fieldErrors.source}
      />
      <FormInput
        label="Destination location"
        placeholder="Endpoint"
        value={form.destination}
        onChangeText={(v) => onChange('destination', v)}
        error={fieldErrors.destination}
      />

      <View style={styles.row}>
        <FormInput
          label="Distance (km)"
          placeholder="0"
          keyboardType="numeric"
          value={form.distance}
          onChangeText={(v) => onChange('distance', v)}
          error={fieldErrors.distance}
          style={styles.third}
        />
        <FormInput
          label="Time (min)"
          placeholder="0"
          keyboardType="numeric"
          value={form.estimatedTime}
          onChangeText={(v) => onChange('estimatedTime', v)}
          error={fieldErrors.estimatedTime}
          style={styles.third}
        />
        <FormInput
          label="Fare"
          placeholder="0"
          keyboardType="numeric"
          value={form.fare}
          onChangeText={(v) => onChange('fare', v)}
          error={fieldErrors.fare}
          style={styles.third}
        />
      </View>

      {error ? <InlineError message={userMessage(error)} /> : null}

      <PrimaryButton title="Add route" onPress={handleSubmit} loading={isSubmitting} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  half: {
    flex: 1,
  },
  third: {
    flex: 1,
  },
});
