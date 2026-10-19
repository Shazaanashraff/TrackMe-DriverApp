import React from 'react';
import { Text } from 'react-native';
import { render, act, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useExplicitSend } from '../hooks';

// A send used to wait for every communications list to reload before it said
// "Sent". In production each reload takes seconds, so "On my way" sat on
// "Sending…" long after the server had accepted it.
const mockRequest = jest.fn();
jest.mock('../provider', () => ({
  useCommunication: () => ({ accountId: 'driver-1', online: true, request: mockRequest }),
}));

test('"Sent" shows once the server accepts, without waiting for the lists to reload', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let loads = 0;
  // The first load answers; every reload after it hangs, like a slow server.
  const roster = () => { loads += 1; return loads === 1 ? Promise.resolve([]) : new Promise(() => {}); };
  let sender;
  function Harness() {
    useQuery({ queryKey: ['communications', 'driver-1', '/driver/riders'], queryFn: roster });
    sender = useExplicitSend('broadcast');
    return <Text>{sender.feedback || 'idle'}</Text>;
  }
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
  await waitFor(() => expect(loads).toBe(1));
  await waitFor(() => expect(sender.restored).toBe(true));

  mockRequest.mockResolvedValue({ _id: 'announcement-1' });
  let result;
  await act(async () => { result = await sender.submit({ path: '/driver/announcements', body: { requestId: 'request-1' } }); });

  expect(result).toEqual({ _id: 'announcement-1' });
  expect(screen.getByText('Sent')).toBeTruthy();
  expect(sender.busy).toBe(false);
  // The reload did start; it just runs in the background.
  expect(loads).toBe(2);
});
