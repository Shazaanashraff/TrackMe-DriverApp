import { formatCurrency, formatDate, formatTime, formatDateTime } from '../formatters';

describe('formatCurrency', () => {
  it('formats a positive number with Rs. prefix', () => {
    expect(formatCurrency(100)).toBe('Rs. 100.00');
    expect(formatCurrency(9.5)).toBe('Rs. 9.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('Rs. 0.00');
  });

  it('handles null and undefined', () => {
    expect(formatCurrency(null)).toBe('Rs. 0.00');
    expect(formatCurrency(undefined)).toBe('Rs. 0.00');
  });

  it('converts numeric strings', () => {
    expect(formatCurrency('250')).toBe('Rs. 250.00');
  });
});

describe('formatDate', () => {
  it('returns "-" for falsy input', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('')).toBe('-');
  });

  it('returns a non-empty string for a valid date', () => {
    const result = formatDate('2024-06-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('-');
  });
});

describe('formatTime', () => {
  it('returns "-" for falsy input', () => {
    expect(formatTime(null)).toBe('-');
    expect(formatTime('')).toBe('-');
  });

  it('returns a time string for a valid date', () => {
    const result = formatTime('2024-06-15T14:30:00Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDateTime', () => {
  it('returns "-" for falsy input', () => {
    expect(formatDateTime(null)).toBe('-');
  });

  it('returns a combined date-time string', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });
});
