import React from 'react';
import { render, act } from '@testing-library/react-native';
import OfflineBanner from '../OfflineBanner';

let listener: ((online: boolean) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('../../../services/backendStatus', () => ({
  __esModule: true,
  getBackendOnline: jest.fn(() => true),
  subscribeBackendStatus: jest.fn((cb: (online: boolean) => void) => {
    listener = cb;
    return mockUnsubscribe;
  }),
}));

import { getBackendOnline } from '../../../services/backendStatus';

beforeEach(() => {
  jest.clearAllMocks();
  listener = null;
  (getBackendOnline as jest.Mock).mockReturnValue(true);
});

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    const { toJSON } = render(<OfflineBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders the offline message when backend status flips offline', () => {
    const { getByText, toJSON } = render(<OfflineBanner />);
    act(() => {
      listener?.(false);
    });
    expect(getByText(/no connection/i)).toBeTruthy();
    expect(toJSON()).not.toBeNull();
  });

  it('goes back to rendering nothing when back online', () => {
    const { queryByText } = render(<OfflineBanner />);
    act(() => {
      listener?.(false);
    });
    act(() => {
      listener?.(true);
    });
    expect(queryByText(/no connection/i)).toBeNull();
  });

  it('starts offline when getBackendOnline() is initially false', () => {
    (getBackendOnline as jest.Mock).mockReturnValue(false);
    const { getByText } = render(<OfflineBanner />);
    expect(getByText(/no connection/i)).toBeTruthy();
  });
});
