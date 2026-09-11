// One rider, opened from the directory. Deliberately small: who they are, and
// the one number to call if something goes wrong on the route.
//
// No address here, and none in the roster payload either — the row draws the
// pickup label ("Home gate") and the server sends nothing more precise.
import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useCommunicationQuery } from "./hooks";
import { useCommunication } from "./provider";
import { Page, styles } from "./components";
import { gradeLine } from "./state";
import { theme } from "../../theme";

function Field({ label, value, hideDivider }) {
  return (
    <View style={[{ paddingVertical: theme.space[3], paddingHorizontal: theme.space[4] }, !hideDivider && { borderTopWidth: 1, borderTopColor: theme.color.border.hairline }]}>
      <Text style={[styles.small, { marginBottom: 4 }]}>{label}</Text>
      <Text selectable style={styles.text}>
        {value}
      </Text>
    </View>
  );
}

export default function RiderProfileScreen({ navigation, route }) {
  const { online } = useCommunication();
  const riderId = route.params?.riderId;
  const query = useCommunicationQuery(riderId ? `/driver/riders/${riderId}` : null);
  const rider = query.data;
  const grade = rider ? gradeLine(rider.category, rider.grade) : "";

  // A rider whose enrollment ended answers 404, which is the same shape as a
  // rider who never existed — deliberately, so ids cannot be probed.
  const status = !rider
    ? query.isLoading
      ? "Loading rider…"
      : !online
      ? "Offline · no cached details for this rider."
      : query.isError
      ? "This rider is no longer enrolled with you."
      : ""
    : "";

  return (
    <Page title="Rider" navigation={navigation}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {rider ? (
          <>
            <View style={{ alignItems: "center", gap: theme.space[3], marginBottom: theme.space[4], marginTop: theme.space[4] }}>
              <Text accessibilityRole="header" style={styles.title}>
                {rider.riderName}
              </Text>
            </View>
            <View style={[styles.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
              {grade ? <Field label="Grade" value={grade} hideDivider /> : null}
              <Field label="Rider code" value={rider.riderCode} hideDivider={!grade} />
              <Field
                label="Contact number"
                value={rider.contactNumber || "Not provided"}
                hideDivider={false}
              />
            </View>
          </>
        ) : (
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {status}
          </Text>
        )}
      </ScrollView>
    </Page>
  );
}
