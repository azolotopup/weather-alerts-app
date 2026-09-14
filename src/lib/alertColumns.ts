import type { SortConfig } from './types';

export const ALERT_COLUMNS: { column: SortConfig['column']; label: string }[] =
  [
    { column: 'event', label: 'Event' },
    { column: 'severity', label: 'Severity' },
    { column: 'area', label: 'Affected area' },
    { column: 'issued', label: 'Issued' },
    { column: 'expires', label: 'Expires' },
  ];
export const defaultSortDirection = (
  column: SortConfig['column'],
): SortConfig['direction'] => (column === 'severity' ? 'desc' : 'asc');
