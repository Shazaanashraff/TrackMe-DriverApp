export interface EarningRecord {
  netEarnings: number;
  journeyDate: string;
  paymentStatus: 'PAID' | 'PENDING';
}

export interface DailyTotal {
  date: string;
  total: number;
}

export interface EarningsStats {
  pending?: { totalPending?: number };
  hasPendingPayoutRequest?: boolean;
}

/** Sums netEarnings across a list of earning records. Empty list -> 0. */
export function sumEarnings(list: EarningRecord[]): number {
  return list.reduce((total, item) => total + (item.netEarnings || 0), 0);
}

/** Groups earning records by journeyDate (YYYY-MM-DD), summing netEarnings per day. */
export function groupByDay(list: EarningRecord[]): DailyTotal[] {
  const totals = new Map<string, number>();

  for (const item of list) {
    const date = item.journeyDate.slice(0, 10);
    totals.set(date, (totals.get(date) || 0) + (item.netEarnings || 0));
  }

  return Array.from(totals.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** The amount available to withdraw right now (server-computed pending total). */
export function availableBalance(stats: EarningsStats | null | undefined): number {
  return stats?.pending?.totalPending || 0;
}

/** True when there's a positive balance and no payout request already pending. */
export function canRequestPayout(stats: EarningsStats | null | undefined): boolean {
  if (stats?.hasPendingPayoutRequest) return false;
  return availableBalance(stats) > 0;
}
