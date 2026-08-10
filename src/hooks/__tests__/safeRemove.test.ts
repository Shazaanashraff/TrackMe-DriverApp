import { safeRemove } from '../useLocationBroadcast';

describe('safeRemove (expo-location web teardown guard)', () => {
  it('calls remove on a healthy subscription', () => {
    const remove = jest.fn();
    safeRemove({ remove });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does not throw when remove() throws (the expo-location web bug)', () => {
    const remove = jest.fn(() => {
      throw new TypeError('LocationEventEmitter.removeSubscription is not a function');
    });
    expect(() => safeRemove({ remove })).not.toThrow();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('is a no-op for null', () => {
    expect(() => safeRemove(null)).not.toThrow();
  });
});
