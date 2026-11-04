// What to tell the driver when a ride ends or a stop is tapped. Pure, so the wording
// is tested in one place and the screen only decides when to show it.

import type { AddStopResult } from '../../services/routeRecorder';

export interface RunOutcome {
  kind: 'sent' | 'queued' | 'nothing';
  runStatus?: 'ACCEPTED' | 'PENDING_MATCH' | 'REJECTED';
  rejectReason?: string;
  runNumber?: number | null;
  routeStatus?: string;
  acceptedRuns?: number;
  requiredRuns?: number;
}

export interface Message {
  title: string;
  body: string;
}

const REJECT_TEXT: Record<string, string> = {
  TOO_FEW_POINTS: 'That ride was too short to record. Drive the whole route and try again.',
  TOO_SHORT: 'That ride covered too little distance to count. Drive the whole route and try again.',
  DUPLICATE: 'That ride was already recorded.',
  NOT_SAME_ROUTE:
    'That ride started or ended somewhere other than your first ride, so it was not counted. Drive the same route each time.',
  NOT_ON_ROAD: 'We could not match that ride to a road, so it was not counted. Try again.',
};

export function describeRunOutcome(outcome: RunOutcome): Message | null {
  if (outcome.kind === 'nothing') return null;

  if (outcome.kind === 'queued') {
    return {
      title: 'Ride saved on your phone',
      body: 'It will be sent as soon as you are back online. You do not need to do anything.',
    };
  }

  if (outcome.runStatus === 'REJECTED') {
    return {
      title: 'Ride not counted',
      body: REJECT_TEXT[outcome.rejectReason || ''] || 'That ride could not be counted. Please try again.',
    };
  }

  if (outcome.runStatus === 'PENDING_MATCH') {
    return { title: 'Ride saved', body: 'It is being processed and will count shortly.' };
  }

  const total = outcome.requiredRuns ?? 5;
  if (outcome.routeStatus === 'PENDING_REVIEW') {
    return {
      title: 'All rides recorded',
      body: 'Your route has been sent to your manager to confirm. You can keep driving as normal.',
    };
  }
  const done = outcome.acceptedRuns ?? outcome.runNumber ?? 1;
  const left = Math.max(total - done, 0);
  return {
    title: `Ride ${done} of ${total} saved`,
    body:
      left > 0
        ? `${left} more ${left === 1 ? 'ride' : 'rides'} to go. Drive the same route each time.`
        : 'Almost done.',
  };
}

export function describeStopResult(result: AddStopResult): string {
  if (result.ok) return 'Stop added';
  switch (result.reason) {
    case 'NO_FIX':
      return 'Waiting for GPS. Try again in a moment.';
    case 'TOO_CLOSE':
      return 'You already added a stop here.';
    default:
      return 'Not recording right now. Go on duty to record a ride.';
  }
}
