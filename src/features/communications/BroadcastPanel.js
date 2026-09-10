import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCommunication } from "./provider";
import { useCommunicationQuery, useExplicitSend } from "./hooks";
import {
  Action,
  Page,
  SendPreview,
  AudienceSelector,
  QuickActionGrid,
  CancellationStrip,
  DateField,
  styles,
} from "./components";
import {
  announcementDraft,
  deliverySummary,
  resourceId,
  newRequestId,
  colomboToday,
} from "./state";
function useBroadcast() {
  const { accountId } = useCommunication();
  const audience = useCommunicationQuery("/driver/riders");
  const templates = useCommunicationQuery("/conversations/presets");
  const sender = useExplicitSend("broadcast");
  const [selected, setSelected] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [announcementId, setAnnouncementId] = useState(null);
  const progress = useCommunicationQuery(
    announcementId ? `/driver/announcements/${announcementId}` : null
  );
  useEffect(() => {
    AsyncStorage.getItem(`last-announcement:${accountId}`)
      .then(setAnnouncementId)
      .catch(() => {});
  }, [accountId]);
  const open = (preset, date) => {
    const draft = announcementDraft(
      preset,
      audience.data || [],
      selected,
      date
    );
    setPreview(draft);
    void sender.save(draft);
  };
  const send = async () => {
    const value = preview;
    setPreview(null);
    const result = await sender.submit(value);
    if (result?._id) {
      setAnnouncementId(result._id);
      await AsyncStorage.setItem(`last-announcement:${accountId}`, result._id);
    }
  };
  const retry = useExplicitSend("broadcast-retry");
  const modals = (
    <>
      <AudienceSelector
        visible={selecting}
        rows={audience.data || []}
        selected={selected}
        onChange={setSelected}
        onClose={() => setSelecting(false)}
      />
      <SendPreview
        visible={!!preview}
        draft={preview}
        busy={sender.busy}
        onSend={send}
        onCancel={() => setPreview(null)}
      />
    </>
  );
  const feedback = (
    <View>
      <Text accessibilityLiveRegion="polite" style={styles.feedback}>
        {sender.busy || sender.draft
          ? sender.feedback
          : progress.data
          ? deliverySummary(progress.data)
          : sender.feedback}
      </Text>
      {sender.draft && !preview ? (
        <Action
          label="Review saved broadcast"
          onPress={() => setPreview(sender.draft)}
          disabled={sender.busy}
        />
      ) : null}
      {progress.data?.recipients?.some((r) => r.state === "failed") ? (
        <Action
          label="Retry failed recipients only"
          onPress={() =>
            retry.submit({
              path: `/driver/announcements/${announcementId}/retry`,
              body: {},
            })
          }
          disabled={retry.busy}
        />
      ) : null}
      {retry.feedback ? (
        <Text style={styles.feedback}>{retry.feedback}</Text>
      ) : null}
    </View>
  );
  return {
    audience,
    templates,
    sender,
    selected,
    setSelected,
    setSelecting,
    open,
    modals,
    feedback,
  };
}
export default function BroadcastPanel({ navigation }) {
  const b = useBroadcast();
  const changes = useCommunicationQuery(
    `/driver/absences?date=${colomboToday()}`
  );
  const ack = useExplicitSend("home-acknowledgment");
  const { height, fontScale } = useWindowDimensions();
  const maxHeight = Math.min(
    560,
    Math.max(280, height * (fontScale > 1.2 ? 0.55 : 0.58))
  );
  return (
    <View testID="fixed-broadcast-panel" style={styles.panel}>
      <ScrollView
        testID="fixed-broadcast-scroll"
        style={{ maxHeight }}
        contentContainerStyle={styles.panelContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <CancellationStrip
          changes={changes.data?.changes}
          busy={ack.busy}
          onView={() => navigation.navigate("Absences")}
          onAcknowledge={(a) =>
            ack.submit({
              path: `/absences/${a._id}/acknowledge`,
              body: { requestId: newRequestId(), expectedRevision: a.revision },
            })
          }
        />
        {ack.feedback ? (
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {ack.feedback}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Action
            label={`${
              b.selected === null ? "All enrolled riders" : "Selected riders"
            } · ${b.selected?.length ?? b.audience.data?.length ?? 0}`}
            style={{ flex: 1 }}
            onPress={() => b.setSelecting(true)}
          />
          <Action
            label={`Absences · ${changes.data?.absentCount || 0}`}
            onPress={() => navigation.navigate("Absences")}
          />
        </View>
        <QuickActionGrid
          actions={b.templates.data?.presets || []}
          onSelect={(preset) => b.open(preset, colomboToday())}
          disabled={
            b.sender.busy || !b.sender.restored || !b.audience.data?.length
          }
        />
        <Action
          label="More updates"
          onPress={() => navigation.navigate("Announcements")}
        />
        {b.feedback}
      </ScrollView>
      {b.modals}
    </View>
  );
}
export function AnnouncementsScreen({ navigation, route }) {
  const b = useBroadcast();
  const history = useCommunicationQuery("/driver/announcements");
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState("20");
  const [date, setDate] = useState(colomboToday());
  const [correctionOf, setCorrectionOf] = useState(
    route.params?.correctionOf || null
  );
  return (
    <Page title="Driver announcements" navigation={navigation}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Action
          label={`${
            b.selected === null ? "All enrolled riders" : "Selected riders"
          } · ${b.selected?.length ?? b.audience.data?.length ?? 0}`}
          onPress={() => b.setSelecting(true)}
        />
        <Text style={styles.small}>
          Each rider receives a private message. Replies are visible only to
          you.
        </Text>
        {correctionOf ? (
          <Text style={styles.text}>
            Correction linked to the selected earlier announcement
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel="Custom announcement"
          placeholder="Write an update (1,000 characters maximum)"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          style={[styles.field, { minHeight: 120 }]}
        />
        <Action
          label="Preview custom update"
          primary
          disabled={!text.trim() || b.sender.busy}
          onPress={() =>
            b.open(
              { id: "custom", text: text.trim(), correctionOf },
              colomboToday()
            )
          }
        />
        <TextInput
          accessibilityLabel="Delay minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          maxLength={3}
          style={styles.field}
        />
        <Action
          label={`Preview ${minutes || "0"} minute delay`}
          disabled={
            !Number.isInteger(Number(minutes)) ||
            Number(minutes) < 1 ||
            Number(minutes) > 180
          }
          onPress={() =>
            b.open(
              {
                // Must stay word for word what canonical() builds for this
                // template id in the backend, or the driver reviews one
                // sentence and their riders receive another.
                id: "traffic",
                parameters: { minutes: Number(minutes) },
                text: `I’m running about ${Number(
                  minutes
                )} minutes behind. Sorry for the inconvenience, I’ll update you if this changes.`,
                correctionOf,
              },
              colomboToday()
            )
          }
        />
        <DateField value={date} onChange={setDate} />
        <Action
          label="Preview service unavailability"
          onPress={() =>
            b.open(
              {
                id: "unavailable",
                parameters: { date },
                text: `Service will be unavailable on ${date}. Please arrange alternative transport.`,
                correctionOf,
              },
              date
            )
          }
        />
        {b.feedback}
        <Text style={styles.title}>Earlier announcements</Text>
        {(history.data || []).map((a) => (
          <View key={a._id} style={styles.card}>
            <Text style={styles.text}>{a.text}</Text>
            <Text style={styles.small}>
              {a.date} · {deliverySummary(a)}
            </Text>
            <Action
              label="Write a linked correction"
              onPress={() => {
                setCorrectionOf(resourceId(a));
                setText("");
              }}
            />
          </View>
        ))}
      </ScrollView>
      {b.modals}
    </Page>
  );
}
