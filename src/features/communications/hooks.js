import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCommunication } from './provider';
export function useCommunicationQuery(path, enabled = true) {
  const { request, accountId, online } = useCommunication();
  const focused = useIsFocused();
  const query = useQuery({ queryKey: ['communications', accountId, path], queryFn: () => request(path),
    enabled: Boolean(accountId && path && enabled && online && focused), refetchInterval: focused && online ? 30000 : false,
    staleTime: 0, retry: 1 });
  const refetch = query.refetch;
  useEffect(() => { if (focused && online && enabled && path) void refetch(); }, [focused, online, enabled, path, refetch]);
  return query;
}
// Only an explicit user action calls submit. Reconnect never sends a saved draft.
// Store the request ID before the network call so uncertain responses are retryable.
export function useExplicitSend(name) {
  const { accountId, online, request } = useCommunication();
  const queryClient = useQueryClient();
  const key = `communication-draft:${accountId}:${name}`;
  const [draft, setDraft] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let alive = true;
    setRestored(false); setDraft(null); setFeedback('');
    AsyncStorage.getItem(key).then(value => { if (alive && value) { setDraft(JSON.parse(value)); setFeedback('Draft saved—review and retry'); } }).catch(() => {}).finally(() => { if (alive) setRestored(true); });
    return () => { alive = false; };
  }, [key]);
  const save = useCallback(async value => {
    await AsyncStorage.setItem(key, JSON.stringify(value)); setDraft(value); setFeedback('');
  }, [key]);
  const clear = useCallback(async () => { await AsyncStorage.removeItem(key); setDraft(null); }, [key]);
  const submit = async (value = draft) => {
    if (lock.current || !value) return null;
    lock.current = true; setBusy(true);
    try {
      await save(value);
      if (!online) { setFeedback('Not sent—offline'); return null; }
      setFeedback('Sending…');
      const result = await request(value.path, value.method || 'POST', value.body);
      if (result?.results?.some(r => !r.success)) {
        setFeedback(result.results.map(r => r.success ? 'Reported' : r.message).join(' · '));
      } else { await clear(); setFeedback('Sent'); }
      await queryClient.invalidateQueries({ queryKey: ['communications', accountId] });
      return result;
    } catch (error) {
      setFeedback(error.kind === 'offline' || !online ? 'Not sent—offline' : `${error.message || 'Not confirmed'} · Review and retry`);
      return null;
    } finally { lock.current = false; setBusy(false); }
  };
  return { draft, save, clear, submit, busy, feedback, setFeedback, restored };
}
