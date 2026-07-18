import React from 'react';
import { render } from '@testing-library/react-native';
import EarningsSummary from '../EarningsSummary';

describe('EarningsSummary', () => {
  it('renders today/week/month/pending totals', () => {
    const { getByText } = render(
      <EarningsSummary
        stats={{
          today: { totalEarnings: 500, totalTrips: 2 },
          week: { totalEarnings: 2500, totalTrips: 10 },
          month: { totalEarnings: 9000, totalTrips: 40 },
          pending: { totalPending: 1200, count: 3 },
        }}
      />
    );

    expect(getByText('Today')).toBeTruthy();
    expect(getByText('This Week')).toBeTruthy();
    expect(getByText('This Month')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Rs. 1200.00')).toBeTruthy();
  });

  it('renders zeroed totals when stats is null', () => {
    const { getAllByText } = render(<EarningsSummary stats={null} />);
    expect(getAllByText('Rs. 0.00').length).toBeGreaterThan(0);
  });

  it('shows the withdraw call-to-action only when there is a pending count', () => {
    const { queryByText, rerender } = render(
      <EarningsSummary stats={{ pending: { totalPending: 0, count: 0 } }} />
    );
    expect(queryByText('Withdraw Earnings')).toBeNull();

    rerender(<EarningsSummary stats={{ pending: { totalPending: 500, count: 1 } }} />);
    expect(queryByText('Withdraw Earnings')).toBeTruthy();
  });
});
