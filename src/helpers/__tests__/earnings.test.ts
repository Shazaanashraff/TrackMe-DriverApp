import {
  sumEarnings,
  groupByDay,
  availableBalance,
  canRequestPayout,
  EarningRecord,
} from '../earnings';

const record = (overrides: Partial<EarningRecord> = {}): EarningRecord => ({
  netEarnings: 100,
  journeyDate: '2026-06-01T10:00:00.000Z',
  paymentStatus: 'PAID',
  ...overrides,
});

describe('sumEarnings', () => {
  it('sums netEarnings across records', () => {
    const list = [record({ netEarnings: 100 }), record({ netEarnings: 250 })];
    expect(sumEarnings(list)).toBe(350);
  });

  it('returns 0 for an empty list', () => {
    expect(sumEarnings([])).toBe(0);
  });
});

describe('groupByDay', () => {
  it('groups and sums earnings per day', () => {
    const list = [
      record({ netEarnings: 100, journeyDate: '2026-06-01T08:00:00.000Z' }),
      record({ netEarnings: 50, journeyDate: '2026-06-01T18:00:00.000Z' }),
      record({ netEarnings: 200, journeyDate: '2026-06-02T09:00:00.000Z' }),
    ];
    expect(groupByDay(list)).toEqual([
      { date: '2026-06-01', total: 150 },
      { date: '2026-06-02', total: 200 },
    ]);
  });

  it('returns an empty array for an empty list', () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe('availableBalance', () => {
  it('returns the pending total', () => {
    expect(availableBalance({ pending: { totalPending: 500 } })).toBe(500);
  });

  it('returns 0 when stats is null/undefined', () => {
    expect(availableBalance(null)).toBe(0);
    expect(availableBalance(undefined)).toBe(0);
  });

  it('returns 0 when pending is missing', () => {
    expect(availableBalance({})).toBe(0);
  });
});

describe('canRequestPayout', () => {
  it('is true when balance is positive and no request is pending', () => {
    expect(canRequestPayout({ pending: { totalPending: 500 } })).toBe(true);
  });

  it('is false when balance is 0', () => {
    expect(canRequestPayout({ pending: { totalPending: 0 } })).toBe(false);
  });

  it('is false when a payout request is already pending, even with a balance', () => {
    expect(
      canRequestPayout({ pending: { totalPending: 500 }, hasPendingPayoutRequest: true })
    ).toBe(false);
  });

  it('is false when stats is null/undefined', () => {
    expect(canRequestPayout(null)).toBe(false);
    expect(canRequestPayout(undefined)).toBe(false);
  });
});
