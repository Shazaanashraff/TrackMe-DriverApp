import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { theme } from "../../theme";
import { colomboToday } from "./state";
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.surface.page },
  content: { padding: theme.space[4], gap: theme.space[3] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[2],
    minWidth: 0,
  },
  title: { ...theme.textStyle("h1"), color: theme.color.text.primary },
  text: { ...theme.textStyle("body"), color: theme.color.text.primary },
  small: { ...theme.textStyle("caption"), color: theme.color.text.secondary },
  segmentedWrap: { paddingHorizontal: theme.space[4], paddingBottom: theme.space[3] },
  // A whole-row target: a driver taps this in a moving vehicle.
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[3],
    minHeight: 64,
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.card,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.hairline,
  },
  profileField: { gap: 2, paddingVertical: theme.space[2] },
  card: {
    padding: theme.space[3],
    borderRadius: theme.radius.card,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.hairline,
    gap: theme.space[2],
  },
  button: {
    minHeight: 56,
    padding: theme.space[2],
    borderRadius: theme.radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.primary[50],
    borderWidth: 1,
    borderColor: theme.color.border.hairline,
  },
  buttonText: {
    ...theme.textStyle("label"),
    color: theme.color.primary[600],
    textAlign: "center",
    flexShrink: 1,
  },
  primary: { backgroundColor: theme.color.primary[600] },
  field: {
    ...theme.textStyle("body"),
    color: theme.color.text.primary,
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.control,
    minHeight: 56,
    padding: theme.space[3],
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] },
  gridCell: { flexBasis: "48%", flexGrow: 1, minWidth: 132 },
  feedback: {
    ...theme.textStyle("caption"),
    color: theme.color.text.primary,
    paddingVertical: theme.space[1],
  },
  sheet: {
    maxHeight: "92%",
    padding: theme.space[4],
    paddingBottom: theme.space[4],
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    backgroundColor: theme.color.surface.raised,
    gap: theme.space[3],
  },
  sheetScroll: { flexShrink: 1 },
  sheetContent: { gap: theme.space[3] },
  panel: {
    marginTop: theme.space[4],
    borderRadius: theme.radius.card,
    backgroundColor: theme.color.surface.card,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
  },
  panelContent: { padding: theme.space[3], gap: theme.space[2] },
  pageHeader: { minHeight: 56, paddingHorizontal: theme.space[4] },
});
export function Action({ label, onPress, disabled, primary, style, testID }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primary,
        style,
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          primary && { color: theme.color.text.onAccent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Page({ title, navigation, children, showBack = true }) {
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.screen}
    >
      <View style={[styles.row, styles.pageHeader]}>
        {showBack && navigation?.canGoBack?.() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              {
                paddingVertical: theme.space[2],
                paddingRight: theme.space[3],
                marginRight: theme.space[2],
              },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Text style={{ ...theme.textStyle("body"), color: theme.color.primary[600] }}>
              Back
            </Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>
          {title}
        </Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Sheet({ visible, title, children, onCancel }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: theme.color.overlay.scrim,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, theme.space[4]) },
          ]}
        >
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          <Action label="Cancel" onPress={onCancel} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function SendPreview({ draft, visible, busy, onSend, onCancel }) {
  return (
    <Sheet visible={visible} title="Review your update" onCancel={onCancel}>
      <Text style={styles.text}>{draft?.preview?.text}</Text>
      <Text style={styles.text}>{draft?.preview?.date} · Asia/Colombo</Text>
      <Text style={styles.text}>{draft?.preview?.audience}</Text>
      <Text style={styles.small}>
        {draft?.preview?.count} recipients · Private conversations
      </Text>
      <Action
        testID="send-broadcast"
        label={`Send to ${draft?.preview?.count || 0} riders`}
        primary
        disabled={busy || !draft?.preview?.count}
        onPress={onSend}
      />
    </Sheet>
  );
}
export function QuickActionGrid({ actions, onSelect, disabled }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <Action
          key={action.id}
          testID={`quick-${action.id}`}
          label={action.label}
          disabled={disabled}
          onPress={() => onSelect(action)}
          style={styles.gridCell}
        />
      ))}
    </View>
  );
}
// One rider as a whole-row tap target, shared by the Riders list and the
// absent list so the two read the same.
export function RiderRow({ name, subtitle, onPress, testID }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.riderRow,
        { backgroundColor: theme.color.ink.base, borderWidth: 0, paddingVertical: theme.space[3] },
        pressed && { opacity: 0.8, backgroundColor: theme.color.ink.raised },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
        <Text numberOfLines={1} style={[styles.text, { color: theme.color.white, fontFamily: theme.fontFamily("medium") }]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.small, { color: theme.color.primary[300], marginTop: 2 }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// Two panes behind one tab. `accessibilityRole="tab"` so a screen reader
// announces it as a switch rather than two unrelated buttons.
export function Segmented({ options, value, onChange }) {
  return (
    <View accessibilityRole="tablist" style={localStyles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={`segment-${option.value}`}
            onPress={() => onChange(option.value)}
            style={[localStyles.segment, selected && localStyles.segmentSelected]}
          >
            <Text style={[localStyles.segmentText, selected && localStyles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const localStyles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: theme.radius.card,
    backgroundColor: theme.color.surface.field,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.control,
  },
  segmentSelected: {
    backgroundColor: theme.color.surface.card,
    ...theme.elevation.card,
  },
  segmentText: {
    ...theme.textStyle("label"),
    color: theme.color.text.secondary,
  },
  segmentTextSelected: {
    color: theme.color.text.primary,
  },
});

export function CancellationStrip({
  changes = [],
  onAcknowledge,
  onView,
  busy,
}) {
  const a = changes[0];
  if (!a) return null;
  return (
    <View
      testID="cancellation-strip"
      style={[styles.card, { backgroundColor: theme.color.warning.bg }]}
    >
      <Text style={styles.text}>
        {a.riderId?.fullName || "Rider"} is coming{" "}
        {a.date === colomboToday() ? "today" : `on ${a.date}`} · absence
        cancelled.
      </Text>
      <View style={styles.row}>
        <Action
          label="Acknowledge"
          primary
          disabled={busy}
          onPress={() => onAcknowledge(a)}
          style={{ flex: 1 }}
        />
        <Action
          label={`View changes${
            changes.length > 1 ? ` · ${changes.length}` : ""
          }`}
          onPress={onView}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
