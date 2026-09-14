import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_SORT,
  mergeAlerts,
  selectAlerts,
  toApiFilters,
  validateDateRange,
} from './alerts';
import { endOfLocalDay, formatAlertTime, startOfLocalDay } from './dateUtils';
import { AREA_CODES, formatAreaName } from './areas';
import type { Alert } from './types';

const alerts: Alert[] = [
  {
    id: 'b',
    event: 'Flood',
    severity: 'Minor',
    sent: '2026-09-12T10:00:00Z',
    expires: '2026-09-15T10:00:00Z',
    areaDesc: 'Beta',
  },
  {
    id: 'c',
    event: 'Tornado',
    severity: 'Extreme',
    sent: '2026-09-13T10:00:00Z',
    expires: '2026-09-14T10:00:00Z',
    description: 'Unique later page text',
    areaDesc: 'Alpha',
  },
  { id: 'a' },
];
describe('loaded alert processing', () => {
  test('canonical API filters omit client-only values and empty selections', () => {
    expect(
      toApiFilters({
        area: ['FL', 'CA', 'FL'],
        severity: [],
        startTime: '2026-09-12T00:00:00Z',
        endTime: '2026-09-14T00:00:00Z',
        searchQuery: 'rain',
      }),
    ).toEqual({
      area: ['CA', 'FL'],
      limit: 20,
      start: '2026-09-12T00:00:00Z',
      end: '2026-09-14T00:00:00Z',
    });
    expect(toApiFilters({})).toEqual({ limit: 20 });
  });
  test('deduplicates overlapping pages and ranks a later page first', () => {
    const merged = mergeAlerts([{ alerts: [alerts[0]!] }, { alerts }]);
    expect(merged).toHaveLength(3);
    expect(selectAlerts(merged, '', DEFAULT_SORT).map(alert => alert.id)).toEqual([
      'c',
      'b',
      'a',
    ]);
    expect(
      selectAlerts(merged, 'UNIQUE later', DEFAULT_SORT).map(alert => alert.id),
    ).toEqual(['c']);
  });
  test('severity direction matches its ranking', () => {
    const values: Alert[] = [
      { id: 'moderate', severity: 'Moderate' },
      { id: 'unknown' },
      { id: 'extreme', severity: 'Extreme' },
      { id: 'minor', severity: 'Minor' },
      { id: 'severe', severity: 'Severe' },
    ];
    const descending = selectAlerts(values, '', DEFAULT_SORT).map(alert => alert.id);
    expect(DEFAULT_SORT).toEqual({ column: 'severity', direction: 'desc' });
    expect(descending).toEqual(['extreme', 'severe', 'moderate', 'minor', 'unknown']);
    expect(
      selectAlerts(values, '', { column: 'severity', direction: 'asc' }).map(alert => alert.id),
    ).toEqual([...descending].reverse());
  });
  test('supports every column, direction, missing values, and stable ties', () => {
    expect(selectAlerts(alerts, '', { column: 'event', direction: 'desc' })[0]?.id).toBe(
      'c',
    );
    expect(selectAlerts(alerts, '', { column: 'area', direction: 'asc' })[0]?.id).toBe(
      'a',
    );
    expect(selectAlerts(alerts, '', { column: 'issued', direction: 'desc' })[0]?.id).toBe(
      'c',
    );
    expect(
      selectAlerts(alerts, '', { column: 'expires', direction: 'desc' })[0]?.id,
    ).toBe('b');
    expect(
      selectAlerts(alerts, '', { column: 'issued', direction: 'asc' })[0]?.id,
    ).toBe('a');
    expect(
      selectAlerts([{ id: 'z' }, { id: 'a' }], '', DEFAULT_SORT).map(a => a.id),
    ).toEqual(['a', 'z']);
    expect(alerts[0]?.id).toBe('b');
  });
  test('uses readable area labels without changing filter codes', () => {
    expect(AREA_CODES).toHaveLength(74);
    expect(formatAreaName('CA')).toBe('California (CA)');
    expect(formatAreaName('LM')).toBe('Lake Michigan (LM)');
    expect(formatAreaName('missing')).toBe('missing');
    expect(toApiFilters({ area: ['CA', 'LM'] }).area).toEqual(['CA', 'LM']);
  });
  test('validates date ranges and formats absent/local dates', () => {
    expect(validateDateRange()).toBeUndefined();
    expect(validateDateRange('invalid')).toContain('valid');
    expect(validateDateRange('2026-09-14', '2026-09-13')).toContain('on or after');
    expect(formatAlertTime()).toBe('Not available');
    expect(formatAlertTime('invalid')).toBe('Not available');
    expect(formatAlertTime('2026-09-14T12:00:00Z')).not.toBe('Not available');
    expect(formatAlertTime(Date.parse('2026-09-14T12:00:00Z'))).toBe(
      formatAlertTime('2026-09-14T12:00:00Z'),
    );
    expect(startOfLocalDay('2026-09-14')).toBe(new Date(2026, 8, 14).toISOString());
    expect(endOfLocalDay('2026-09-14')).toBe(
      new Date(2026, 8, 14, 23, 59, 59, 999).toISOString(),
    );
  });
});
