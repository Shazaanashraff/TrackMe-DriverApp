import { describeRunOutcome, describeStopResult } from '../customRouteMessages';

describe('describeRunOutcome', () => {
  it('says nothing when there was no ride to send', () => {
    expect(describeRunOutcome({ kind: 'nothing' })).toBeNull();
  });

  it('reassures a driver whose ride is waiting for signal', () => {
    const msg = describeRunOutcome({ kind: 'queued' })!;
    expect(msg.title).toBe('Ride saved on your phone');
    expect(msg.body).toMatch(/back online/i);
  });

  it('counts the ride and how many are left', () => {
    const msg = describeRunOutcome({
      kind: 'sent', runStatus: 'ACCEPTED', runNumber: 2, acceptedRuns: 2, requiredRuns: 5, routeStatus: 'RECORDING',
    })!;
    expect(msg.title).toBe('Ride 2 of 5 saved');
    expect(msg.body).toMatch(/3 more rides to go/);
  });

  it('uses the singular for the last ride to go', () => {
    const msg = describeRunOutcome({
      kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 4, requiredRuns: 5, routeStatus: 'RECORDING',
    })!;
    expect(msg.body).toMatch(/1 more ride to go/);
  });

  it('follows a raised target (the manager asked for more rides)', () => {
    const msg = describeRunOutcome({
      kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 6, requiredRuns: 7, routeStatus: 'RECORDING',
    })!;
    expect(msg.title).toBe('Ride 6 of 7 saved');
  });

  it('announces that the route went to the manager after the last ride', () => {
    const msg = describeRunOutcome({
      kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 5, requiredRuns: 5, routeStatus: 'PENDING_REVIEW',
    })!;
    expect(msg.title).toBe('All rides recorded');
    expect(msg.body).toMatch(/manager/i);
  });

  it('explains each reason a ride was not counted', () => {
    const reasons = ['TOO_FEW_POINTS', 'TOO_SHORT', 'DUPLICATE', 'NOT_SAME_ROUTE', 'NOT_ON_ROAD'];
    const bodies = reasons.map((rejectReason) => {
      const msg = describeRunOutcome({ kind: 'sent', runStatus: 'REJECTED', rejectReason })!;
      expect(msg.title).toBe('Ride not counted');
      return msg.body;
    });
    expect(new Set(bodies).size).toBe(reasons.length); // each has its own wording
  });

  it('has a plain fallback for a reason it does not know', () => {
    const msg = describeRunOutcome({ kind: 'sent', runStatus: 'REJECTED', rejectReason: 'SOMETHING_NEW' })!;
    expect(msg.body).toMatch(/could not be counted/i);
  });

  it('says a ride is still being processed', () => {
    const msg = describeRunOutcome({ kind: 'sent', runStatus: 'PENDING_MATCH' })!;
    expect(msg.title).toBe('Ride saved');
    expect(msg.body).toMatch(/processed/i);
  });
});

describe('describeStopResult', () => {
  it('confirms a stop', () => {
    expect(describeStopResult({ ok: true, stop: { lat: 1, lng: 1, t: 1, name: '' } })).toBe('Stop added');
  });

  it('tells the driver why a stop was refused', () => {
    expect(describeStopResult({ ok: false, reason: 'NO_FIX' })).toMatch(/waiting for gps/i);
    expect(describeStopResult({ ok: false, reason: 'TOO_CLOSE' })).toMatch(/already added a stop here/i);
    expect(describeStopResult({ ok: false, reason: 'NOT_RECORDING' })).toMatch(/not recording/i);
  });
});
