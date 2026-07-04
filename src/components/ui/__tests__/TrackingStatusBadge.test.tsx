import React from 'react';
import { render } from '@testing-library/react-native';
import TrackingStatusBadge from '../TrackingStatusBadge';

describe('TrackingStatusBadge', () => {
  it.each([
    ['idle', 'Idle'],
    ['starting', 'Starting…'],
    ['tracking', 'Tracking'],
    ['error', 'Error'],
  ] as const)('shows the %s label', (status, label) => {
    const { getByText } = render(<TrackingStatusBadge status={status} />);
    expect(getByText(label)).toBeTruthy();
  });

  it('shows a reconnecting label when tracking but isReconnecting is true', () => {
    const { getByText } = render(<TrackingStatusBadge status="tracking" isReconnecting />);
    expect(getByText('Reconnecting…')).toBeTruthy();
  });

  it('does not show reconnecting for non-tracking statuses even if isReconnecting is true', () => {
    const { getByText, queryByText } = render(<TrackingStatusBadge status="idle" isReconnecting />);
    expect(getByText('Idle')).toBeTruthy();
    expect(queryByText('Reconnecting…')).toBeNull();
  });
});
