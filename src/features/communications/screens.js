import React, { useState } from "react";
import { ScrollView, View, Text, TextInput } from "react-native";
import { useCommunication } from "./provider";
import { useCommunicationQuery, useExplicitSend } from "./hooks";
import {
  Page,
  Action,
  AbsenceCard,
  Freshness,
  DateField,
  Sheet,
  styles,
} from "./components";
import { newRequestId, colomboToday } from "./state";

export function emptyListMessage(query, online, loading, error, empty) {
  if (!online && !query.data)
    return error.replace("Could not load", "Offline · no cached");
  if (query.isLoading) return loading;
  if (query.isError && !query.data) return `${error} Use Refresh to try again.`;
  return empty;
}
export function AbsencesScreen({ navigation, route, embedded = false }) {
  const { role, online } = useCommunication();
  const [date, setDate] = useState(colomboToday());
  const [history, setHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const riderId = route.params?.riderId;
  const path =
    role === "driver"
      ? `/driver/absences?date=${date}`
      : `/absences?view=${history ? "history" : "upcoming"}${
          riderId ? `&riderId=${riderId}` : ""
        }`;
  const query = useCommunicationQuery(path);
  const sender = useExplicitSend(`absence-change:${role}`);
  const rows = (query.data?.rows || []).filter((a) =>
    `${a.riderId?.fullName} ${a.riderId?.riderCode} ${a.enrollmentId?.driverId?.organization?.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const sections =
    role === "driver"
      ? [
          ["Absent", rows.filter((a) => a.status === "ABSENT")],
          [
            "Coming after cancellation",
            rows.filter((a) => a.status === "CANCELLED"),
          ],
          ["History", rows.filter((a) => a.status === "RETIRED")],
        ]
      : [[history ? "History" : "Upcoming", rows]];
  const change = (a, action) => ({
    path: `/absences/${a._id}/${action}`,
    body: { requestId: newRequestId(), expectedRevision: a.revision },
    preview: {
      name: a.riderId?.fullName,
      date: a.date,
      driver: a.driverId?.name,
      action,
    },
  });
  const body = (
    <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {role === "driver" ? (
          <DateField value={date} onChange={setDate} />
        ) : (
          <View style={styles.row}>
            <Action
              label="Upcoming"
              primary={!history}
              onPress={() => setHistory(false)}
              style={{ flex: 1 }}
            />
            <Action
              label="History"
              primary={history}
              onPress={() => setHistory(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}
        <TextInput
          accessibilityLabel="Search absences"
          placeholder="Search rider, code or organization"
          value={search}
          onChangeText={setSearch}
          style={styles.field}
        />
        <Freshness query={query} online={online} />
        {!query.data ? (
          <Text style={styles.feedback}>
            {emptyListMessage(
              query,
              online,
              "Loading absences…",
              "Could not load absences.",
              "No absence notices."
            )}
          </Text>
        ) : null}
        <Text style={styles.text}>
          {query.data?.absentCount || 0} absent
          {role === "driver"
            ? ` · ${
                query.data?.changes?.length || 0
              } cancellations awaiting acknowledgment`
            : ""}
        </Text>
        {role === "driver" &&
        query.data?.changes?.some((a) => a.date !== date) ? (
          <View style={styles.card}>
            <Text style={styles.text}>Changes on other dates</Text>
            {query.data.changes
              .filter((a) => a.date !== date)
              .map((a) => (
                <Action
                  key={a._id}
                  label={`${a.riderId?.fullName} · ${a.date} · Review change`}
                  onPress={() => setDate(a.date)}
                />
              ))}
          </View>
        ) : null}
        {sections.map(([title, entries]) => (
          <View key={title} style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={styles.title}>
              {title} · {entries.length}
            </Text>
            {entries.map((a) => (
              <AbsenceCard
                key={a._id}
                absence={a}
                onCancel={
                  role === "driver"
                    ? undefined
                    : () => setConfirm(change(a, "cancel"))
                }
                onAcknowledge={
                  role === "driver"
                    ? () => sender.submit(change(a, "acknowledge"))
                    : undefined
                }
                busy={sender.busy}
              />
            ))}
          </View>
        ))}
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {sender.feedback}
        </Text>
        {sender.draft ? (
          <Action
            label="Review saved change"
            onPress={() => setConfirm(sender.draft)}
          />
        ) : null}
    </ScrollView>
  );
  const sheet = (
    <Sheet
        visible={!!confirm}
        title={
          confirm?.preview?.action === "cancel"
            ? "Cancel this absence?"
            : "Acknowledge this change?"
        }
        onCancel={() => setConfirm(null)}
      >
        <Text style={styles.text}>
          {confirm?.preview?.name} · {confirm?.preview?.date} ·{" "}
          {confirm?.preview?.driver}
        </Text>
        <Action
          label="Confirm change"
          primary
          disabled={sender.busy}
          onPress={async () => {
            const result = await sender.submit(confirm);
            if (result) setConfirm(null);
          }}
        />
    </Sheet>
  );
  if (embedded) {
    return (
      <>
        {body}
        {sheet}
      </>
    );
  }
  return (
    <Page
      title={role === "driver" ? "Absences" : "My Absences"}
      navigation={navigation}
    >
      {body}
      {sheet}
    </Page>
  );
}
