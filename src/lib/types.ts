import type { components, paths } from '../api/schema';

export type Alert = components['schemas']['Alert'] & { id: string };
export type WeatherAlertParams = paths['/alerts']['get']['parameters'];

export type AlertQuery = NonNullable<WeatherAlertParams['query']>;
export type FilterKey =
  'area' | 'event' | 'severity' | 'status' | 'certainty' | 'urgency';
export type AlertFilters = Pick<AlertQuery, FilterKey> & {
  startTime?: string;
  endTime?: string;
  searchQuery?: string;
};
export interface SortConfig {
  column: 'event' | 'severity' | 'area' | 'issued' | 'expires';
  direction: 'asc' | 'desc';
}
export interface SavedPreferences {
  activeFilters: AlertFilters;
  sortConfig: SortConfig;
}
export interface AlertPage {
  alerts: Alert[];
  next?: string;
  updated?: string;
}
