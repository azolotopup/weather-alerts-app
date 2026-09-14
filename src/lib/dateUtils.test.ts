import { expect, test } from 'bun:test';
import { formatAlertTime } from './dateUtils';

const date = new Date(2026, 8, 15, 14, 4).getTime();

test('formats full local dates with a 24-hour clock', () => {
  expect(formatAlertTime(date)).toBe('15 Sep 2026, 14:04');
  expect(formatAlertTime(new Date(date).toISOString())).toBe(
    '15 Sep 2026, 14:04',
  );
  expect(formatAlertTime(new Date(2026, 8, 15, 0, 4).getTime())).toBe(
    '15 Sep 2026, 00:04',
  );
});

test('missing and invalid dates have readable fallbacks', () => {
  for (const value of [undefined, null, '', 'invalid']) {
    expect(formatAlertTime(value)).toBe('Not available');
  }
  expect(formatAlertTime(0)).not.toBe('Not available');
});
