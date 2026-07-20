import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomRouteSection from '../CustomRouteSection';

jest.mock('react-native-copilot', () => ({
  CopilotProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../components/CustomRouteRecorder', () => {
  const { Text } = require('react-native');
  return function MockCustomRouteRecorder({ mode, routeId }: { mode?: string; routeId?: string }) {
    return <Text testID="mock-recorder">{`recorder:${mode || 'create'}:${routeId || ''}`}</Text>;
  };
});

const baseProps = {
  bus: { busId: 'BUS-1' },
  showUpdateRecorder: false,
  onShowUpdateRecorder: jest.fn(),
  onRecorderSubmitted: jest.fn(),
};

describe('CustomRouteSection', () => {
  it('renders nothing for a normal (non-custom) route', () => {
    const { toJSON } = render(<CustomRouteSection {...baseProps} customRoute={{ isCustomRoute: false }} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing for an ACTIVE custom route with no pending change request', () => {
    const { toJSON } = render(
      <CustomRouteSection
        {...baseProps}
        customRoute={{ isCustomRoute: true, status: 'ACTIVE', hasPendingChangeRequest: false }}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('shows the awaiting-naming card once stops have been recorded', () => {
    const { getByText } = render(
      <CustomRouteSection
        {...baseProps}
        customRoute={{ isCustomRoute: true, status: 'PENDING_NAMING', stopsCount: 4, distance: 2.5 }}
      />
    );
    expect(getByText('Your route')).toBeTruthy();
    expect(getByText('Awaiting manager naming')).toBeTruthy();
  });

  it('opens the recorder in create mode before any stops are recorded', () => {
    const { getByTestId } = render(
      <CustomRouteSection
        {...baseProps}
        customRoute={{ isCustomRoute: true, status: 'PENDING_NAMING', stopsCount: 0 }}
      />
    );
    expect(getByTestId('mock-recorder').props.children).toBe('recorder:create:');
  });

  it('opens the recorder in update mode when showUpdateRecorder is set', () => {
    const { getByTestId } = render(
      <CustomRouteSection
        {...baseProps}
        showUpdateRecorder
        customRoute={{ isCustomRoute: true, status: 'ACTIVE', routeId: 'ROUTE-1', hasPendingChangeRequest: true }}
      />
    );
    expect(getByTestId('mock-recorder').props.children).toBe('recorder:update:ROUTE-1');
  });

  it('shows the update-route banner and fires onShowUpdateRecorder', () => {
    const onShowUpdateRecorder = jest.fn();
    const { getByTestId } = render(
      <CustomRouteSection
        {...baseProps}
        onShowUpdateRecorder={onShowUpdateRecorder}
        customRoute={{ isCustomRoute: true, status: 'ACTIVE', routeId: 'ROUTE-1', hasPendingChangeRequest: true }}
      />
    );
    fireEvent.press(getByTestId('update-route-button'));
    expect(onShowUpdateRecorder).toHaveBeenCalledTimes(1);
  });
});
