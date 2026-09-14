import { spyOn } from 'bun:test';

export const mockFetch = (
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) => {
  return spyOn(globalThis, 'fetch').mockImplementation(
    Object.assign(handler, { preconnect: globalThis.fetch.preconnect }),
  );
};
