import createFetchClient from 'openapi-fetch';
import type { Alert, AlertPage, AlertQuery } from '../lib/types';
import { isRecord } from '../lib/utils';
import type { paths } from './schema';

const REQUEST_TIMEOUT = 30_000;
const MAX_RETRIES = 2;
const MAX_RETRY_DELAY = 30_000;

export const API_URL = (
  process.env.BUN_PUBLIC_WSAPI_URL || 'https://api.weather.gov'
).replace(/\/$/, '');

const client = createFetchClient<paths>({
  baseUrl: API_URL,
  headers: {
    Accept: 'application/ld+json',
    'User-Agent':
      process.env.BUN_PUBLIC_WSAPI_USER_AGENT || 'weather-alerts-app',
  },
  querySerializer: { array: { style: 'form', explode: false } },
  fetch: request => globalThis.fetch(request),
});

export class WeatherApiError extends Error {
  readonly retryAt: number;

  constructor(
    message: string,
    public status = 0,
    public retryAfter = 0,
  ) {
    super(message);
    this.name = 'WeatherApiError';
    this.retryAt = Date.now() + retryAfter;
  }
}

export const normalizeAlert = (value: unknown): Alert => {
  if (!isRecord(value)) {
    throw new WeatherApiError('The weather service returned an invalid alert.');
  }

  const rawId = value.id ?? value['@id'];
  if (typeof rawId !== 'string' || !rawId) {
    throw new WeatherApiError(
      'The weather service returned an alert without an identifier.',
    );
  }

  let id = rawId;
  if (rawId.startsWith('http')) {
    try {
      const path = new URL(rawId).pathname;
      id = decodeURIComponent(path.split('/').pop() ?? '');
    } catch {
      throw new WeatherApiError(
        'The weather service returned an invalid alert identifier.',
      );
    }
  }

  return { ...value, id } as Alert;
};

const withTimeout = (signal: AbortSignal): AbortSignal => {
  return AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT)]);
};

const getRetryAfter = (response: Response): number => {
  const header = response.headers.get('Retry-After');
  if (!header) {
    return 0;
  }

  // Retry-After can be either a number of seconds or an HTTP date.
  const seconds = Number(header);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(header) - Date.now();

  return Number.isFinite(delay) ? Math.max(0, delay) : 0;
};

const checkResponse = (response: Response): void => {
  if (response.ok) {
    return;
  }

  let message = 'Unable to load weather alerts. Please try again.';

  if (response.status === 429) {
    message = 'The weather service is busy. Please wait before retrying.';
  } else if (response.status === 400) {
    message =
      'The weather service rejected these filters. Check your selections and date range.';
  }

  throw new WeatherApiError(message, response.status, getRetryAfter(response));
};

const getNextPageUrl = (next: string): URL => {
  let url: URL;
  try {
    url = new URL(next, API_URL);
  } catch {
    throw new WeatherApiError(
      'The weather service returned an invalid next-page link.',
    );
  }

  if (url.origin !== new URL(API_URL).origin || url.pathname !== '/alerts') {
    throw new WeatherApiError(
      'The weather service returned an invalid next-page link.',
    );
  }

  return url;
};

const parsePage = (data: unknown): AlertPage => {
  if (!isRecord(data) || !Array.isArray(data['@graph'])) {
    throw new WeatherApiError(
      'The weather service returned an invalid alert collection.',
    );
  }

  let next: string | undefined;
  if (data.pagination !== undefined) {
    if (
      !isRecord(data.pagination) ||
      (data.pagination.next !== undefined &&
        typeof data.pagination.next !== 'string')
    ) {
      throw new WeatherApiError(
        'The weather service returned invalid pagination.',
      );
    }

    const nextLink = data.pagination.next as string | undefined;
    next = nextLink ? getNextPageUrl(nextLink).href : undefined;
  }

  return {
    alerts: data['@graph'].map(normalizeAlert),
    next: next || undefined,
    updated: typeof data.updated === 'string' ? data.updated : undefined,
  };
};

export const fetchAlertPage = async (
  query: AlertQuery,
  next: string | undefined,
  signal: AbortSignal,
): Promise<AlertPage> => {
  const nextUrl = next ? getNextPageUrl(next) : undefined;
  const { data, response } = await client.GET('/alerts', {
    params: { query },
    signal: withTimeout(signal),
    // The next link owns the cursor and filters for subsequent requests.
    ...(nextUrl ? { querySerializer: () => nextUrl.search.slice(1) } : {}),
  });

  checkResponse(response);
  return parsePage(data);
};

export const fetchAlertDetails = async (
  id: string,
  signal: AbortSignal,
): Promise<Alert> => {
  const { data, response } = await client.GET('/alerts/{id}', {
    params: { path: { id } },
    signal: withTimeout(signal),
  });

  checkResponse(response);

  const body: unknown = data;
  if (!isRecord(body)) {
    return normalizeAlert(body);
  }

  // Live JSON-LD details are a single object; the schema also permits @graph.
  if (Array.isArray(body['@graph'])) {
    const alerts = body['@graph'].map(normalizeAlert);
    const alert = alerts.find(alert => alert.id === id);

    if (!alert) {
      throw new WeatherApiError(
        'The selected alert was not returned by the weather service.',
      );
    }

    return alert;
  }

  return normalizeAlert(isRecord(body.properties) ? body.properties : body);
};

export const fetchEventTypes = async (
  signal: AbortSignal,
): Promise<string[]> => {
  const { data, response } = await client.GET('/alerts/types', {
    signal: withTimeout(signal),
  });

  checkResponse(response);
  return data?.eventTypes ?? [];
};

export const shouldRetry = (count: number, error: Error): boolean => {
  if (count >= MAX_RETRIES) {
    return false;
  }

  if (!(error instanceof WeatherApiError)) {
    return true;
  }

  return error.status === 429 || error.status >= 500;
};

export const retryDelay = (count: number, error: Error): number => {
  const backoff = Math.min(1000 * 2 ** count, MAX_RETRY_DELAY);
  const serverDelay = error instanceof WeatherApiError ? error.retryAfter : 0;
  return Math.max(backoff, serverDelay);
};
