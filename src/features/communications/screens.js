import React, { useEffect, useState } from "react";
import { FlatList, ScrollView, View, Text, TextInput } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCommunication } from "./provider";
import { useCommunicationQuery, useExplicitSend } from "./hooks";
import {
  Page,
  Action,
  RiderIdentity,
  MessageBubble,
  AbsenceCard,
  Freshness,
  DateField,
  Sheet,
  styles,
} from "./components";
import { resourceId, newRequestId, colomboToday, mergeMessages } from "./state";
import { theme } from "../../theme";

function emptyListMessage(query, online, loading, error, empty) {
  if (!online && !query.data)
    return error.replace("Could not load", "Offline · no cached");
  if (query.isLoading) return loading;
  if (query.isError && !query.data) return `${error} Use Refresh to try again.`;
  return empty;
}
export function MessagesScreen({ navigation }) {
  const { riders = [] } = useAuth();
  const { role, online } = useCommunication();
  const [riderFilter, setRiderFilter] = useState("");
  const query = useCommunicationQuery(
    `/conversations${riderFilter ? `?riderId=${riderFilter}` : ""}`
  );
  return (
    <Page title="Messages" navigation={navigation} showBack={false}>
      <View style={{ padding: theme.space[3], gap: theme.space[2] }}>
        <Action
          label={role === "driver" ? "Absences and changes" : "My Absences"}
          onPress={() => navigation.navigate("Absences")}
        />
        <Freshness query={query} online={online} />
        {role !== "driver" ? (
          <ScrollView horizontal>
            <View style={styles.row}>
              <Action
                label="All riders"
                primary={!riderFilter}
                onPress={() => setRiderFilter("")}
              />
              {riders.map((r) => (
                <Action
                  key={r._id}
                  label={r.fullName}
                  primary={riderFilter === r._id}
                  onPress={() => setRiderFilter(r._id)}
                />
              ))}
            </View>
          </ScrollView>
        ) : (
          <Action
            label="Message a rider"
            onPress={() => navigation.navigate("RiderAudience")}
          />
        )}
      </View>
      <FlatList
        data={query.data || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <Text style={styles.text}>
            {emptyListMessage(
              query,
              online,
              "Loading conversations…",
              "Could not load conversations.",
              "No conversations yet. Open an enrolled shuttle to start a private message."
            )}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <RiderIdentity
              name={item.rider?.fullName || item.riderName}
              code={item.rider?.riderCode}
              driverName={item.driverName}
              unread={item.unread}
            />
            <Text numberOfLines={2} style={styles.text}>
              {item.preview?.text || "Start a conversation"}
            </Text>
            {item.readOnly ? (
              <Text style={styles.small}>Enrollment ended · History only</Text>
            ) : null}
            <Action
              label="Open conversation"
              onPress={() =>
                navigation.navigate("Conversation", {
                  conversationId: item._id,
                  riderId: item.riderId,
                })
              }
            />
          </View>
        )}
      />
    </Page>
  );
}
export function RiderAudienceScreen({ navigation }) {
  const { request, online } = useCommunication();
  const query = useCommunicationQuery("/driver/riders");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const filtered = (query.data || []).filter((r) =>
    `${r.riderName} ${r.riderCode}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Page title="Enrolled riders" navigation={navigation}>
      <View style={{ paddingHorizontal: theme.space[4], gap: theme.space[2] }}>
        <TextInput
          accessibilityLabel="Search riders"
          style={styles.field}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or rider code"
        />
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {error}
        </Text>
        <Freshness query={query} online={online} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => resourceId(r.riderId)}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <Text style={styles.text}>
            {emptyListMessage(
              query,
              online,
              "Loading enrolled riders…",
              "Could not load enrolled riders.",
              search
                ? "No riders match this search."
                : "No active rider enrollments yet."
            )}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <RiderIdentity name={item.riderName} code={item.riderCode} />
            <Text style={styles.small}>
              {item.organization} ·{" "}
              {item.pickup?.label || "Pickup not specified"}
            </Text>
            <Action
              label="Message rider"
              onPress={async () => {
                try {
                  const c = await request("/conversations", "POST", {
                    riderId: resourceId(item.riderId),
                  });
                  navigation.navigate("Conversation", {
                    conversationId: c._id,
                    riderId: resourceId(item.riderId),
                  });
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          </View>
        )}
      />
    </Page>
  );
}
export function ConversationScreen({ navigation, route }) {
  const { role, request, online } = useCommunication();
  const { conversationId, riderId, driverId } = route.params || {};
  const [resolved, setResolved] = useState(conversationId);
  const [resolveError, setResolveError] = useState("");
  useEffect(() => {
    let alive = true;
    setResolved(conversationId);
    setResolveError("");
    if (!conversationId && riderId && driverId)
      request("/conversations", "POST", { riderId, driverId })
        .then((c) => {
          if (alive) setResolved(c._id);
        })
        .catch((e) => {
          if (alive) setResolveError(e.message);
        });
    return () => {
      alive = false;
    };
  }, [conversationId, riderId, driverId, request]);
  return (
    <Page title="Private conversation" navigation={navigation}>
      {resolved ? (
        <ConversationContent
          key={resolved}
          id={resolved}
          navigation={navigation}
          role={role}
          request={request}
          online={online}
        />
      ) : (
        <Text style={styles.text}>
          {resolveError || "Opening conversation…"}
        </Text>
      )}
    </Page>
  );
}
function ConversationContent({ id, navigation, role, request, online }) {
  const query = useCommunicationQuery(`/conversations/${id}/messages`);
  const sender = useExplicitSend(`conversation:${id}`);
  const ack = useExplicitSend(`conversation-ack:${id}`);
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState("5");
  const [older, setOlder] = useState([]);
  const [cursor, setCursor] = useState(undefined);
  const [pageError, setPageError] = useState("");
  useEffect(() => {
    if (sender.restored && sender.draft?.body?.text)
      setText(sender.draft.body.text);
  }, [sender.restored, sender.draft]);
  const c = query.data?.conversation;
  const messages = mergeMessages(older, query.data?.messages || []);
  const lastId = query.data?.messages?.at(-1)?._id;
  useEffect(() => {
    if (lastId && online)
      request(`/conversations/${id}/read`, "PUT", {
        throughMessageId: lastId,
      }).catch(() => {});
  }, [lastId, id, request, online]);
  const readThrough =
    role === "driver" ? c?.userReadThrough : c?.driverReadThrough;
  const quick =
    role === "driver"
      ? [
          { id: "arrived", label: "Arrived" },
          { id: "passed", label: "Already passed your stop" },
          { id: "can_collect", label: "Can collect you" },
        ]
      : [
          { id: "ready", label: "Ready at pickup" },
          { id: "waiting", label: "Waiting" },
          { id: "running_late", label: `Running late · ${minutes} min` },
          { id: "thanks", label: "Thanks" },
        ];
  const send = async (body) => {
    const existing = sender.draft?.body;
    const retry =
      existing &&
      existing.text === body.text &&
      existing.templateId === body.templateId &&
      JSON.stringify(existing.parameters) === JSON.stringify(body.parameters);
    const result = await sender.submit(
      retry
        ? sender.draft
        : {
            path: `/conversations/${id}/messages`,
            body: { ...body, requestId: newRequestId() },
          }
    );
    if (result) setText("");
  };
  return (
    <>
      <View style={{ padding: theme.space[3], gap: theme.space[2] }}>
        <RiderIdentity name={c?.riderName} driverName={c?.driverName} />
        <Freshness query={query} online={online} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.eventId}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          (cursor === undefined ? query.data?.nextCursor : cursor) ? (
            <Action
              label="Load earlier messages"
              onPress={async () => {
                try {
                  const page = await request(
                    `/conversations/${id}/messages?before=${
                      cursor === undefined ? query.data.nextCursor : cursor
                    }`
                  );
                  setOlder((previous) =>
                    mergeMessages(previous, page.messages)
                  );
                  setCursor(page.nextCursor);
                } catch (e) {
                  setPageError(e.message);
                }
              }}
            />
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.text}>
            {emptyListMessage(
              query,
              online,
              "Loading messages…",
              "Could not load messages.",
              "No messages yet. Use a quick reply or write the first message."
            )}
          </Text>
        }
        ListFooterComponent={
          <>
            <Text accessibilityLiveRegion="polite" style={styles.feedback}>
              {pageError}
            </Text>
            {(query.data?.absences || []).map((a) => (
              <AbsenceCard
                key={a._id}
                absence={{
                  ...a,
                  riderId: { _id: a.riderId, fullName: c?.riderName },
                  driverId: { _id: a.driverId, name: c?.driverName },
                }}
                onCancel={
                  role === "driver"
                    ? undefined
                    : () =>
                        navigation.navigate("Absences", {
                          riderId: resourceId(c.riderId),
                        })
                }
                onAcknowledge={
                  role === "driver"
                    ? (a) =>
                        ack.submit({
                          path: `/absences/${a._id}/acknowledge`,
                          body: {
                            requestId: newRequestId(),
                            expectedRevision: a.revision,
                          },
                        })
                    : undefined
                }
                busy={ack.busy}
              />
            ))}
          </>
        }
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            own={item.sender === role}
            read={readThrough && item._id <= readThrough}
          />
        )}
      />
      {query.data?.readOnly ? (
        <Text style={[styles.text, { padding: theme.space[4] }]}>
          Enrollment ended. Conversation history is read-only.
        </Text>
      ) : (
        <View
          style={{
            padding: theme.space[3],
            gap: theme.space[2],
            borderTopWidth: theme.borderWidth.hairline,
            borderColor: theme.color.border.hairline,
          }}
        >
          {role !== "driver" ? (
            <View style={styles.row}>
              <Action
                label="Report absence"
                style={{ flex: 1 }}
                disabled={!c}
                onPress={() =>
                  navigation.navigate("ReportAbsence", {
                    riderId: resourceId(c.riderId),
                    driverId: resourceId(c.driverId),
                    riderName: c.riderName,
                  })
                }
              />
              <TextInput
                accessibilityLabel="Running late minutes"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                maxLength={3}
                style={[styles.field, { width: 72 }]}
              />
            </View>
          ) : null}
          <ScrollView horizontal keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              {quick.map((q) => (
                <Action
                  key={q.id}
                  label={q.label}
                  disabled={sender.busy || !sender.restored}
                  onPress={() =>
                    send({
                      templateId: q.id,
                      ...(q.id === "running_late"
                        ? { parameters: { minutes: Number(minutes) } }
                        : {}),
                    })
                  }
                />
              ))}
            </View>
          </ScrollView>
          <View style={styles.row}>
            <TextInput
              accessibilityLabel="Message"
              placeholder="Message · up to 1,000 characters"
              value={text}
              multiline
              maxLength={1000}
              onChangeText={(value) => {
                setText(value);
                void sender.save({
                  path: `/conversations/${id}/messages`,
                  body: { text: value, requestId: newRequestId() },
                });
              }}
              style={[styles.field, { flex: 1, maxHeight: 112 }]}
            />
            <Action
              label="Send"
              primary
              disabled={!text.trim() || sender.busy || !sender.restored}
              onPress={() => send({ text })}
            />
          </View>
          {sender.draft && sender.feedback ? (
            <Action
              label="Retry saved message"
              disabled={sender.busy}
              onPress={() => sender.submit()}
            />
          ) : null}
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {sender.feedback || ack.feedback}
          </Text>
        </View>
      )}
    </>
  );
}
export function AbsencesScreen({ navigation, route }) {
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
  return (
    <Page
      title={role === "driver" ? "Absences" : "My Absences"}
      navigation={navigation}
    >
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
                onConversation={() =>
                  navigation.navigate("Conversation", {
                    conversationId: resourceId(a.conversationId),
                    riderId: resourceId(a.riderId),
                  })
                }
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
    </Page>
  );
}
