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
    expect(getByText('This week')).toBeTruthy();
    expect(getByText('This month')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Rs. 1200.00')).toBeTruthy();
    expect(getByText('3 trips')).toBeTruthy();
  });

  it('renders zeroed totals when stats is null', () => {
    const { getAllByText } = render(<EarningsSummary stats={null} />);
    expect(getAllByText('Rs. 0.00').length).toBeGreaterThan(0);
    expect(getAllByText('0 trips').length).toBeGreaterThan(0);
  });

  it('shows skeletons instead of amounts while loading', () => {
    const { queryByText } = render(<EarningsSummary stats={null} isLoading />);
    expect(queryByText('Rs. 0.00')).toBeNull();
  });
});
