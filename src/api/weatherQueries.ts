import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { toApiFilters } from '../lib/alerts';
import type { AlertFilters } from '../lib/types';
import {
  fetchAlertDetails,
  fetchAlertPage,
  fetchEventTypes,
  retryDelay,
  shouldRetry,
} from './weatherApi';

const retryOptions = { retry: shouldRetry, retryDelay };

export const weatherAlertsOptions = (filters: AlertFilters = {}) => {
  const apiFilters = toApiFilters(filters);

  return infiniteQueryOptions({
    ...retryOptions,
    queryKey: ['weatherAlerts', apiFilters] as const,
    queryFn: ({ pageParam, signal }) => fetchAlertPage(apiFilters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.next,
    // Keep the collection stable until an explicit refresh restarts pagination.
    staleTime: Infinity,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const alertDetailsOptions = (alertId: string) =>
  queryOptions({
    ...retryOptions,
    queryKey: ['weatherAlert', alertId] as const,
    queryFn: ({ signal }) => fetchAlertDetails(alertId, signal),
    staleTime: 60_000,
  });

export const alertEventTypesOptions = () =>
  queryOptions({
    ...retryOptions,
    queryKey: ['alertEventTypes'] as const,
    queryFn: ({ signal }) => fetchEventTypes(signal),
    staleTime: Infinity,
  });
