import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import FormInput from '../../components/ui/FormInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { MAX_STOP_NAME_LENGTH } from '../../services/routeRecorder';

// Tapping a suggestion fills the box, so a driver who has pulled up to a stop can name it
// in one tap and still edit it.
export const STOP_NAME_SUGGESTIONS = ["Student's house", 'School gate', 'Bus stand'];

type Props = {
  visible: boolean;
  onSave: (name: string) => void;
  // Leaves the stop unnamed; the manager can name it when they review the route.
  onSkip: () => void;
};

// The sheet's content lives in its own component: the Modal renders nothing while hidden, so
// the text box starts empty every time it opens without any reset logic.
function SheetBody({ onSave, onSkip }: Omit<Props, 'visible'>) {
  const [name, setName] = useState('');
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const trimmed = name.trim();

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        testID="stop-name-sheet"
        style={[styles.sheet, { paddingBottom: Math.max(theme.space[8], theme.space[5] + bottomInset) }]}
      >
        <AppText variant="h2">Name this stop</AppText>
        <AppText variant="label" color={theme.color.text.secondary} style={styles.message}>
          The stop is saved. Add a name so parents and your manager know where it is.
        </AppText>

        <FormInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Nimal's house"
          maxLength={MAX_STOP_NAME_LENGTH}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => { if (trimmed) onSave(trimmed); }}
          testID="stop-name-input"
        />

        <View style={styles.chips}>
          {STOP_NAME_SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => setName(suggestion)}
              style={styles.chip}
              accessibilityRole="button"
              testID={`stop-name-suggestion-${suggestion}`}
            >
              <AppText variant="label" color={theme.color.primary[600]}>{suggestion}</AppText>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          title="Save name"
          onPress={() => onSave(trimmed)}
          disabled={!trimmed}
          style={styles.save}
          testID="stop-name-save"
        />
        <PrimaryButton title="Skip" variant="secondary" onPress={onSkip} testID="stop-name-skip" />
      </View>
    </KeyboardAvoidingView>
  );
}

// Asked right after the driver marks a stop. The stop's position is already saved at the
// moment of the tap, so naming it can wait until the vehicle is stationary.
export default function StopNameSheet({ visible, onSave, onSkip }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <SheetBody onSave={onSave} onSkip={onSkip} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    padding: theme.space[5],
    ...theme.elevation.sheet,
  },
  message: { marginTop: theme.space[2], marginBottom: theme.space[4] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2], marginBottom: theme.space[5] },
  chip: {
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[2],
    borderRadius: 999,
    backgroundColor: theme.color.primary[50],
  },
  save: { marginBottom: theme.space[3] },
});
