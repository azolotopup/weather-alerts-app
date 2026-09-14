import dayjs from 'dayjs';
import { AREA_CODES } from './areas';
import type { Alert, AlertFilters, AlertQuery, FilterKey, SortConfig } from './types';

export { AREA_CODES };

export const PAGE_SIZE = 100;
export const DEFAULT_SORT: SortConfig = { column: 'severity', direction: 'desc' };
export const FILTER_KEYS: FilterKey[] = [
  'area',
  'event',
  'severity',
  'status',
  'urgency',
  'certainty',
];

export const FILTER_OPTIONS = {
  area: AREA_CODES,
  event: [],
  severity: ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'],
  status: ['actual', 'exercise', 'system', 'test', 'draft'],
  urgency: ['Immediate', 'Expected', 'Future', 'Past', 'Unknown'],
  certainty: ['Observed', 'Likely', 'Possible', 'Unlikely', 'Unknown'],
} satisfies Record<FilterKey, string[]>;

export const FILTER_LABELS: Record<FilterKey, string> = {
  area: 'State / area',
  event: 'Event',
  severity: 'Severity',
  status: 'Status',
  urgency: 'Urgency',
  certainty: 'Certainty',
};

export const toApiFilters = (filters: AlertFilters): AlertQuery => {
  const query: AlertQuery = { limit: PAGE_SIZE };

  for (const key of FILTER_KEYS) {
    const values = filters[key];
    if (!values?.length) {
      continue;
    }

    // Selection order shouldn't create a different query-cache entry.
    Object.assign(query, { [key]: [...new Set(values)].sort() });
  }

  if (filters.startTime) {
    query.start = filters.startTime;
  }
  if (filters.endTime) {
    query.end = filters.endTime;
  }

  return query;
};

export const validateDateRange = (start?: string, end?: string): string | undefined => {
  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : null;

  if ((startDate && !startDate.isValid()) || (endDate && !endDate.isValid())) {
    return 'Enter a valid date.';
  }
  if (startDate && endDate && startDate.isAfter(endDate)) {
    return 'The end date must be on or after the start date.';
  }
};

const matchesSearch = (alert: Alert, term: string): boolean => {
  const fields = [
    alert.event,
    alert.headline,
    alert.areaDesc,
    alert.description,
    alert.instruction,
  ];

  return fields.some(value => value?.toLocaleLowerCase().includes(term));
};

export const getSearchExcerpt = (alert: Alert, search: string): string | undefined => {
  const term = search.trim().toLocaleLowerCase();
  if (!term || alert.event?.toLocaleLowerCase().includes(term)) {
    return undefined;
  }

  const fields = [alert.headline, alert.areaDesc, alert.description, alert.instruction];
  const match = fields.find(value => value?.toLocaleLowerCase().includes(term));
  if (!match) {
    return undefined;
  }

  const position = match.toLocaleLowerCase().indexOf(term);
  const start = Math.max(0, position - 35);
  const end = Math.min(match.length, position + term.length + 65);
  return `${start ? '…' : ''}${match.slice(start, end)}${end < match.length ? '…' : ''}`;
};

const getSortValue = (alert: Alert, column: SortConfig['column']): string | number => {
  switch (column) {
    case 'severity':
      return FILTER_OPTIONS.severity.length - 1 -
        FILTER_OPTIONS.severity.indexOf(alert.severity ?? 'Unknown');
    case 'issued':
    case 'expires': {
      const date = dayjs((column === 'issued' ? alert.sent : alert.expires) ?? '');
      return date.isValid() ? date.valueOf() : Number.NEGATIVE_INFINITY;
    }
    case 'area':
      return alert.areaDesc ?? '';
    case 'event':
      return alert.event ?? '';
  }
};

const compareValues = (left: string | number, right: string | number): number => {
  if (typeof left === 'number' && typeof right === 'number') {
    if (left === right) {
      return 0;
    }
    return left < right ? -1 : 1;
  }

  return String(left).localeCompare(String(right));
};

export const selectAlerts = (alerts: Alert[], search: string, sort: SortConfig): Alert[] => {
  const term = search.trim().toLocaleLowerCase();
  const matches = term ? alerts.filter(alert => matchesSearch(alert, term)) : alerts;
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...matches].sort((left, right) => {
    const order = compareValues(
      getSortValue(left, sort.column),
      getSortValue(right, sort.column),
    );

    return order * direction || left.id.localeCompare(right.id);
  });
};

export const mergeAlerts = (pages: { alerts: Alert[] }[]): Alert[] => {
  const alertsById = new Map<string, Alert>();

  for (const page of pages) {
    for (const alert of page.alerts) {
      alertsById.set(alert.id, alert);
    }
  }

  return [...alertsById.values()];
};
