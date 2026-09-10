import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCommunication } from "./provider";
import { useCommunicationQuery, useExplicitSend } from "./hooks";
import {
  Action,
  SendPreview,
  AudienceSelector,
  QuickActionGrid,
  CancellationStrip,
  styles,
} from "./components";
import {
  announcementDraft,
  deliverySummary,
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
          onView={() => navigation.navigate("MainTabs", { screen: "Riders", params: { tab: "absences" } })}
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
            onPress={() => navigation.navigate("MainTabs", { screen: "Riders", params: { tab: "absences" } })}
          />
        </View>
        <QuickActionGrid
          actions={b.templates.data?.presets || []}
          onSelect={(preset) => b.open(preset, colomboToday())}
          disabled={
            b.sender.busy || !b.sender.restored || !b.audience.data?.length
          }
        />
        {b.feedback}
      </ScrollView>
      {b.modals}
    </View>
  );
}
