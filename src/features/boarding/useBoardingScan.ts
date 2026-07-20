import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { subscribeBackendStatus } from '../../services/backendStatus';
import { AppError, normalizeError, isOfflineError } from '../../lib/errors';
import api from '../../services/api';

export type BoardingEventType = 'BOARD' | 'ALIGHT';

export type BoardingScanResult = {
  eventId?: string;
  studentId?: string;
  studentName?: string;
  busId?: string;
  routeId?: string;
  type?: BoardingEventType;
  timestamp?: string;
  tripId?: string;
  source?: string;
};

export type BoardingScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'debounced';

type QueuedScan = { qrToken: string; busId: string; timestamp: number };

const QUEUE_KEY = 'boarding_scan_queue';
const COOLDOWN_MS = 3000;

const INVALID_QR_MESSAGE = 'This QR code is invalid or expired.';
const QR_NOT_ENABLED_MESSAGE = "QR attendance isn't enabled for this route yet — contact your manager.";
const BUS_NOT_FOUND_MESSAGE = 'Something went wrong. Please try again.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

function isDebounced(response: unknown): boolean {
  return !!response && typeof response === 'object' && (response as { debounced?: boolean }).debounced === true;
}

function friendlyMessageFor(error: AppError): string {
  if (error.status === 401) return INVALID_QR_MESSAGE;
  if (error.status === 403) return QR_NOT_ENABLED_MESSAGE;
  if (error.status === 404) return BUS_NOT_FOUND_MESSAGE;
  return GENERIC_ERROR_MESSAGE;
}

async function readQueue(): Promise<QueuedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedScan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Best-effort; losing the persisted queue just means fewer offline replays.
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthenticatedRequest = (fn: (...args: any[]) => Promise<unknown>, ...args: unknown[]) => Promise<unknown>;

export function useBoardingScan(busId: string) {
  const { authenticatedRequest } = useAuth() as { authenticatedRequest: AuthenticatedRequest };

  const [status, setStatus] = useState<BoardingScanStatus>('idle');
  const [lastResult, setLastResult] = useState<BoardingScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayingRef = useRef(false);

  useEffect(() => {
    readQueue().then((queue) => setPendingCount(queue.length));
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    cooldownRef.current = true;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, []);

  const queueScan = useCallback(async (qrToken: string, busId: string) => {
    const queue = await readQueue();
    queue.push({ qrToken, busId, timestamp: Date.now() });
    await writeQueue(queue);
    setPendingCount(queue.length);
  }, []);

  const submitScan = useCallback(
    async (qrToken: string, type?: BoardingEventType) => {
      if (!busId) return;
      if (cooldownRef.current) return;
      startCooldown();

      setStatus('scanning');
      setErrorMessage(null);

      try {
        const res = await authenticatedRequest(api.submitBoardingScan, { qrToken, busId, type });
        const data = unwrap<BoardingScanResult>(res);
        if (isDebounced(res)) {
          setStatus('debounced');
        } else {
          setStatus('success');
        }
        setLastResult(data);
      } catch (err) {
        const normalized = normalizeError(err);
        if (isOfflineError(normalized)) {
          await queueScan(qrToken, busId);
          setStatus('error');
          setErrorMessage("You're offline. This scan will be sent when you're back online.");
          return;
        }
        setStatus('error');
        setErrorMessage(friendlyMessageFor(normalized));
      }
    },
    [authenticatedRequest, busId, queueScan, startCooldown]
  );

  const replayQueuedScans = useCallback(async () => {
    if (replayingRef.current) return;
    replayingRef.current = true;
    try {
      const queue = await readQueue();
      if (queue.length === 0) return;

      const remaining: QueuedScan[] = [];
      for (const item of queue) {
        try {
          const res = await authenticatedRequest(api.submitBoardingScan, {
            qrToken: item.qrToken,
            busId: item.busId,
          });
          const data = unwrap<BoardingScanResult>(res);
          setLastResult(data);
          setStatus(isDebounced(res) ? 'debounced' : 'success');
        } catch (err) {
          const normalized = normalizeError(err);
          if (isOfflineError(normalized)) {
            // Still offline — keep this (and the rest of the queue) for next time.
            remaining.push(item);
          }
          // Non-offline errors (e.g. now-expired token) are dropped; the server
          // is the source of truth and near-duplicate replays are idempotent.
        }
      }

      await writeQueue(remaining);
      setPendingCount(remaining.length);
    } finally {
      replayingRef.current = false;
    }
  }, [authenticatedRequest]);

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((online: boolean) => {
      if (online) replayQueuedScans();
    });
    return unsubscribe;
  }, [replayQueuedScans]);

  return { status, lastResult, errorMessage, pendingCount, submitScan, replayQueuedScans };
}
