import dayjs from 'dayjs';
import {
  DEFAULT_SORT,
  FILTER_KEYS,
  FILTER_OPTIONS,
  validateDateRange,
} from '../lib/alerts';
import type { AlertFilters, SavedPreferences, SortConfig } from '../lib/types';
import { endOfLocalDay, startOfLocalDay } from '../lib/dateUtils';
import { isRecord } from '../lib/utils';

const STORAGE_KEY = 'weather-alerts-filters';
const STORAGE_VERSION = 3;
const SORT_COLUMNS = ['event', 'severity', 'area', 'issued', 'expires'];

const oneWeekAgo = (): string => startOfLocalDay(dayjs().subtract(7, 'day'));

export const defaultPreferences = (): SavedPreferences => {
  return {
    activeFilters: { startTime: oneWeekAgo() },
    sortConfig: { ...DEFAULT_SORT },
  };
};

const readFilters = (saved: Record<string, unknown>): AlertFilters => {
  const filters: AlertFilters = {};

  for (const key of FILTER_KEYS) {
    const values = saved[key];
    if (!Array.isArray(values)) {
      continue;
    }

    const validValues = values.filter((value): value is string => {
      if (typeof value !== 'string') {
        return false;
      }
      return key === 'event' ? value.length > 0 : FILTER_OPTIONS[key].includes(value);
    });

    if (validValues.length) {
      Object.assign(filters, { [key]: [...new Set(validValues)] });
    }
  }

  const start = typeof saved.startTime === 'string' ? saved.startTime : undefined;
  const end = typeof saved.endTime === 'string' ? saved.endTime : undefined;
  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : null;
  const startDay = startDate?.isValid() ? startOfLocalDay(startDate) : undefined;
  const endDay = endDate?.isValid() ? endOfLocalDay(endDate) : undefined;

  if ((!start || startDay) && (!end || endDay) && !validateDateRange(startDay, endDay)) {
    filters.startTime = startDay;
    filters.endTime = endDay;
  }

  if (typeof saved.searchQuery === 'string') {
    filters.searchQuery = saved.searchQuery;
  }

  return filters;
};

const readSortConfig = (saved: unknown): SortConfig => {
  if (
    !isRecord(saved) ||
    typeof saved.column !== 'string' ||
    typeof saved.direction !== 'string' ||
    !SORT_COLUMNS.includes(String(saved.column)) ||
    !['asc', 'desc'].includes(String(saved.direction))
  ) {
    return { ...DEFAULT_SORT };
  }

  return {
    column: saved.column as SortConfig['column'],
    direction: saved.direction as SortConfig['direction'],
  };
};

export const readPreferences = (): SavedPreferences => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

    if (
      !isRecord(saved) ||
      (saved.version !== 1 && saved.version !== 2 && saved.version !== STORAGE_VERSION) ||
      !isRecord(saved.activeFilters)
    ) {
      return defaultPreferences();
    }

    const activeFilters = readFilters(saved.activeFilters);
    if (saved.version === 1 && !activeFilters.startTime) {
      const startTime = oneWeekAgo();
      if (!activeFilters.endTime || activeFilters.endTime >= startTime) {
        activeFilters.startTime = startTime;
      }
    }

    const sortConfig = readSortConfig(saved.sortConfig);
    if (
      saved.version !== STORAGE_VERSION &&
      isRecord(saved.sortConfig) &&
      saved.sortConfig.column === 'severity' &&
      (saved.sortConfig.direction === 'asc' || saved.sortConfig.direction === 'desc')
    ) {
      sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    return { activeFilters, sortConfig };
  } catch {
    // Storage can be blocked, full, or left over from an older app version.
    return defaultPreferences();
  }
};

export const writePreferences = (preferences: SavedPreferences): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...preferences }),
    );
  } catch {
    // Preferences still work for this session when storage isn't available.
  }
};
