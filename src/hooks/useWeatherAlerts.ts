import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  API_URL,
  fetchAlertPage,
  retryDelay,
  shouldRetry,
  WeatherApiError,
} from '../api/weatherApi';
import { mergeAlerts, toApiFilters } from '../lib/alerts';
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
  const apiFilters = toApiFilters(filters);
  const queryKey = ['weatherAlerts', apiFilters] as const;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchAlertPage(apiFilters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.next,
    retry: shouldRetry,
    retryDelay,
    staleTime: Infinity,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

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
    return queryClient.resetQueries({ queryKey, exact: true });
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
