import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL, WeatherApiError } from '../api/weatherApi';
import { weatherAlertsOptions } from '../api/weatherQueries';
import { mergeAlerts } from '../lib/alerts';
import type { AlertFilters } from '../lib/types';

const hasRepeatedLink = (next: string | undefined, previousPages: unknown[]): boolean => {
  if (!next) {
    return false;
  }

  const nextUrl = new URL(next, API_URL).href;
  return previousPages.some(
    page => typeof page === 'string' && new URL(page, API_URL).href === nextUrl,
  );
};

export const useWeatherAlerts = (filters: AlertFilters = {}) => {
  const queryClient = useQueryClient();
  const options = weatherAlertsOptions(filters);
  const query = useInfiniteQuery(options);

  const { hasNextPage, fetchNextPage } = query;
  const pages = query.data?.pages;
  const next = pages?.at(-1)?.next;
  const repeatedLink = hasRepeatedLink(next, query.data?.pageParams ?? []);
  const error = repeatedLink
    ? new WeatherApiError(
        'Pagination stopped because the weather service repeated a page link. Refresh to try again.',
      )
    : query.error;

  const alerts = useMemo(() => mergeAlerts(pages ?? []), [pages]);
  const hasMore = Boolean(hasNextPage && !repeatedLink);

  const loadMore = async () => {
    if (hasMore && !query.isFetching && !error) {
      await fetchNextPage({ cancelRefetch: false });
    }
  };

  const refresh = () => {
    return queryClient.resetQueries({ queryKey: options.queryKey, exact: true });
  };

  const retry = () => {
    if (repeatedLink) {
      return refresh();
    }
    if (pages?.length) {
      return fetchNextPage({ cancelRefetch: false });
    }
    return query.refetch();
  };

  return {
    alerts,
    error,
    hasMore,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isPaused: query.fetchStatus === 'paused',
    updatedAt: query.dataUpdatedAt,
    loadMore,
    retry,
    refresh,
  };
};
