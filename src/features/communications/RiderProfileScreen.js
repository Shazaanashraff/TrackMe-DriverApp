// One rider, opened from the directory. Deliberately small: who they are, and
// the one number to call if something goes wrong on the route.
//
// The home address is not here and is not on the wire — a driver sees the pickup
// label ("Home gate") on the row and nothing more precise.
import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useCommunicationQuery } from "./hooks";
import { useCommunication } from "./provider";
import { Page, RiderAvatar, styles } from "./components";
import { gradeLine } from "./state";
import { theme } from "../../theme";

function Field({ label, value }) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.small}>{label}</Text>
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
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {rider ? (
          <>
            <View style={{ alignItems: "center", gap: theme.space[3] }}>
              <RiderAvatar rider={rider} name={rider.riderName} size={96} />
              <Text accessibilityRole="header" style={styles.title}>
                {rider.riderName}
              </Text>
            </View>
            <View style={styles.card}>
              {grade ? <Field label="Grade" value={grade} /> : null}
              <Field label="Rider code" value={rider.riderCode} />
              <Field
                label="Contact number"
                value={rider.contactNumber || "Not provided"}
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
