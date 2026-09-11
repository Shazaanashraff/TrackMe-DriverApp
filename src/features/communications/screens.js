import React, { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { useCommunication } from "./provider";
import { useCommunicationQuery } from "./hooks";
import { Page, RiderRow, styles } from "./components";
import { colomboToday, resourceId, toDisplayDate } from "./state";

export function emptyListMessage(query, online, loading, error, empty) {
  if (!online && !query.data)
    return error.replace("Could not load", "Offline · no cached");
  if (query.isLoading) return loading;
  if (query.isError && !query.data)
    return `${error} It reloads when you reopen this tab.`;
  return empty;
}

// Beneath the name: where this rider is picked up. Absence rows carry no grade,
// so organization and pickup label are all the server sends.
const subtitle = (a) =>
  [
    a.enrollmentId?.driverId?.organization?.name,
    a.enrollmentId?.pickupPlaceId?.label,
  ]
    .filter(Boolean)
    .join(" · ") || a.riderId?.riderCode;

// Who is away today. Riders can only report the current day, so there is no
// date to choose. Cancellations are acknowledged from the Home strip, not
// here, so this list is only the riders the driver should not wait for.
export function AbsencesScreen({ navigation, embedded = false }) {
  const { online } = useCommunication();
  const date = colomboToday();
  const [search, setSearch] = useState("");
  const query = useCommunicationQuery(`/driver/absences?date=${date}`);
  const absent = (query.data?.rows || []).filter(
    (a) =>
      a.status === "ABSENT" &&
      `${a.riderId?.fullName} ${a.riderId?.riderCode} ${a.enrollmentId?.driverId?.organization?.name}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const body = (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.small}>Today · {toDisplayDate(date)}</Text>
      <TextInput
        accessibilityLabel="Search absences"
        placeholder="Search rider, code or organization"
        value={search}
        onChangeText={setSearch}
        style={styles.field}
      />
      {!query.data || absent.length === 0 ? (
        <Text style={styles.feedback}>
          {emptyListMessage(
            query,
            online,
            "Loading absences…",
            "Could not load absences.",
            search
              ? "No riders match this search."
              : "No riders absent today."
          )}
        </Text>
      ) : null}
      {absent.map((a) => (
        <RiderRow
          key={a._id}
          testID={`absent-row-${resourceId(a.riderId)}`}
          name={a.riderId?.fullName}
          subtitle={subtitle(a)}
          onPress={() =>
            navigation.navigate("RiderProfile", {
              riderId: resourceId(a.riderId),
            })
          }
        />
      ))}
    </ScrollView>
  );
  if (embedded) return body;
  return (
    <Page title="Absences" navigation={navigation}>
      {body}
    </Page>
  );
}
