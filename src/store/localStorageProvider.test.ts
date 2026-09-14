import { expect, spyOn, test } from 'bun:test';
import {
  defaultPreferences,
  readPreferences,
  writePreferences,
} from './localStorageProvider';
import { useAlertStore } from './alertStore';

test('round-trips preferences without transient selection or API pages', () => {
  const state = useAlertStore.getState();
  state.setActiveFilters({
    area: ['FL'],
    searchQuery: 'wind',
    startTime: '2026-09-14T00:00:00Z',
  });
  state.setSortConfig({ column: 'issued', direction: 'desc' });
  state.setSelectedAlertId('selected');
  const localStart = new Date('2026-09-14T00:00:00Z');
  localStart.setHours(0, 0, 0, 0);
  expect(readPreferences()).toEqual({
    activeFilters: {
      area: ['FL'],
      searchQuery: 'wind',
      startTime: localStart.toISOString(),
    },
    sortConfig: { column: 'issued', direction: 'desc' },
  });
  expect(localStorage.getItem('weather-alerts-filters')).not.toContain('selected');
  state.clearFilters();
  expect(useAlertStore.getState().selectedAlertId).toBeNull();
  expect(readPreferences().activeFilters).toEqual({});
});

test('rejects corrupt, incompatible, or invalid saved values', () => {
  for (const value of ['bad json', 'null', '{"version":2}', '[]']) {
    localStorage.setItem('weather-alerts-filters', value);
    expect(readPreferences()).toEqual(defaultPreferences());
  }
  localStorage.setItem(
    'weather-alerts-filters',
    JSON.stringify({
      version: 1,
      activeFilters: {
        area: ['US', 'FL', 'FL', 2],
        severity: 'Extreme',
        event: ['Flood', ''],
        startTime: 'bad',
        endTime: 'bad',
        searchQuery: 5,
      },
      sortConfig: { column: 'invalid' },
    }),
  );
  expect(readPreferences()).toEqual({
    ...defaultPreferences(),
    activeFilters: {
      ...defaultPreferences().activeFilters,
      area: ['FL'],
      event: ['Flood'],
    },
  });
  writePreferences({
    ...defaultPreferences(),
    activeFilters: { endTime: '2026-09-14T00:00:00Z' },
  });
  const localEnd = new Date('2026-09-14T00:00:00Z');
  localEnd.setHours(23, 59, 59, 999);
  expect(readPreferences().activeFilters.endTime).toBe(localEnd.toISOString());
});

test('preserves severity order from saved preferences', () => {
  localStorage.setItem(
    'weather-alerts-filters',
    JSON.stringify({
      version: 2,
      activeFilters: {},
      sortConfig: { column: 'severity', direction: 'asc' },
    }),
  );
  expect(readPreferences().sortConfig).toEqual({ column: 'severity', direction: 'desc' });

  localStorage.setItem(
    'weather-alerts-filters',
    JSON.stringify({
      version: 3,
      activeFilters: {},
      sortConfig: { column: 'severity', direction: 'asc' },
    }),
  );
  expect(readPreferences().sortConfig).toEqual({ column: 'severity', direction: 'asc' });
});

test('unavailable storage leaves the app usable', () => {
  spyOn(localStorage, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new Error('full');
  });
  expect(readPreferences()).toEqual(defaultPreferences());
  expect(() => writePreferences(defaultPreferences())).not.toThrow();
});
