import { expect, spyOn, test } from 'bun:test';
import {
  API_URL,
  fetchAlertDetails,
  fetchAlertPage,
  fetchEventTypes,
  normalizeAlert,
  retryDelay,
  shouldRetry,
  WeatherApiError,
} from './weatherApi';
import { mockFetch } from '../test/mockFetch';

const signal = () => new AbortController().signal;
const reply = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/ld+json', ...headers },
  });

test('serializes API arrays and follows next links without losing filters/cursors', async () => {
  const requests: string[] = [];
  mockFetch(async input => {
    requests.push((input as Request).url);
    return reply({
      '@graph': [{ id: 'a' }],
      updated: 'now',
      pagination: {
        next: API_URL + '/alerts?area=FL,CA&cursor=opaque%2Btoken',
      },
    });
  });
  const page = await fetchAlertPage(
    { area: ['FL', 'CA'], limit: 50 },
    undefined,
    signal(),
  );
  expect(new URL(requests[0]!).searchParams.get('area')).toBe('FL,CA');
  expect(page.updated).toBe('now');
  await fetchAlertPage({ limit: 50 }, page.next, signal());
  expect(new URL(requests[1]!).searchParams.get('cursor')).toBe('opaque+token');
  await expect(
    fetchAlertPage({}, 'https://example.com/alerts', signal()),
  ).rejects.toThrow('next-page');
});

test('normalizes detail variants and event options', async () => {
  const fetch = spyOn(globalThis, 'fetch');
  fetch.mockResolvedValue(reply({ id: 'urn:alert:1', event: 'Flood' }));
  expect((await fetchAlertDetails('urn:alert:1', signal())).event).toBe(
    'Flood',
  );
  fetch.mockResolvedValue(reply({ '@graph': [{ id: 'urn:alert:1' }] }));
  expect((await fetchAlertDetails('urn:alert:1', signal())).id).toBe(
    'urn:alert:1',
  );
  fetch.mockResolvedValue(reply({ properties: { id: 'urn:alert:1' } }));
  expect((await fetchAlertDetails('urn:alert:1', signal())).id).toBe(
    'urn:alert:1',
  );
  fetch.mockResolvedValue(reply({ '@graph': [] }));
  await expect(fetchAlertDetails('missing', signal())).rejects.toThrow(
    'not returned',
  );
  fetch.mockResolvedValue(reply({ eventTypes: ['Flood'] }));
  expect(await fetchEventTypes(signal())).toEqual(['Flood']);
  fetch.mockResolvedValue(reply({}));
  expect(await fetchEventTypes(signal())).toEqual([]);
  expect(
    normalizeAlert({ '@id': API_URL + '/alerts/urn%3Aalert%3A1' }).id,
  ).toBe('urn:alert:1');
  expect(() => normalizeAlert(null)).toThrow('invalid');
  expect(() => normalizeAlert({})).toThrow('identifier');
  expect(() => normalizeAlert({ id: 'http://[invalid' })).toThrow('identifier');
});

test('rejects malformed collections and handles HTTP retry policy', async () => {
  const fetch = spyOn(globalThis, 'fetch');
  for (const body of [
    {},
    { '@graph': [], pagination: { next: 5 } },
    { '@graph': [], pagination: { next: 'http://[invalid' } },
  ]) {
    fetch.mockResolvedValue(reply(body));
    await expect(fetchAlertPage({}, undefined, signal())).rejects.toThrow();
  }
  fetch.mockResolvedValue(reply({ '@graph': [] }));
  expect((await fetchAlertPage({}, undefined, signal())).next).toBeUndefined();
  for (const status of [400, 429, 503]) {
    fetch.mockResolvedValue(reply({}, status, { 'Retry-After': '2' }));
    try {
      await fetchAlertPage({}, undefined, signal());
      throw new Error('expected request failure');
    } catch (error) {
      expect(error).toBeInstanceOf(WeatherApiError);
      expect(shouldRetry(0, error as Error)).toBe(status !== 400);
      expect(retryDelay(0, error as Error)).toBe(2000);
    }
  }
  fetch.mockResolvedValue(
    reply({}, 429, {
      'Retry-After': new Date(Date.now() + 60_000).toUTCString(),
    }),
  );
  await expect(fetchEventTypes(signal())).rejects.toThrow('busy');
  expect(shouldRetry(2, new Error('network'))).toBe(false);
  expect(shouldRetry(0, new Error('network'))).toBe(true);
  expect(retryDelay(0, new Error())).toBe(1000);
});
