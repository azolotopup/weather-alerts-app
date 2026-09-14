import { expect, test, type Page } from 'playwright/test';

const alerts = (page: number) =>
  Array.from({ length: 20 }, (_, index) => ({
    id: `page-${page}-${index}`,
    event: `Alert ${page}-${String(index).padStart(2, '0')}`,
    severity: page === 1 ? 'Minor' : 'Severe',
    areaDesc: 'Example County',
    sent: '2026-09-15T10:00:00Z',
  }));

const openFilters = async (page: Page) => {
  const toggle = page.getByRole('button', { name: 'Show filters' });
  if (await toggle.isVisible()) await toggle.click();
};
const list = (page: Page) =>
  page.getByRole('region', { name: 'Scrollable weather alerts' });
const bottom = async (page: Page) =>
  list(page).evaluate(el => {
    el.scrollTop = el.scrollHeight;
  });

const fixture = async (
  page: Page,
  options: { failNext?: boolean; repeatNext?: boolean } = {},
) => {
  const requests: URL[] = [];
  let release: (() => void) | undefined;
  let nextPending = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route('https://weather.test/alerts**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/alerts/types')
      return route.fulfill({ json: { eventTypes: [] } });
    requests.push(url);
    const second = url.searchParams.has('cursor');
    if (second) await nextPending;
    if (second && options.failNext)
      return route.fulfill({ status: 400, json: {} });
    return route.fulfill({
      json: {
        '@graph': alerts(second ? 2 : 1),
        ...(!second || options.repeatNext
          ? {
              pagination: {
                next: 'https://weather.test/alerts?limit=20&cursor=page2',
              },
            }
          : {}),
      },
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(20);
  return {
    requests,
    release: () => release?.(),
    recover: () => {
      options.failNext = false;
      nextPending = new Promise<void>(resolve => {
        release = resolve;
      });
    },
  };
};

test('fetches 20 only on scroll, prevents overlapping requests, anchors sorted results and stops at the end', async ({
  page,
}) => {
  const api = await fixture(page);
  expect(api.requests).toHaveLength(1);
  expect(api.requests[0]!.searchParams.get('limit')).toBe('20');
  await expect(
    page.getByRole('button', { name: 'Load more alerts' }),
  ).toHaveCount(0);
  await bottom(page);
  await expect.poll(() => api.requests.length).toBe(2);
  await expect(list(page).getByRole('status')).toContainText('Loading alerts');
  const anchor = await list(page).evaluate(root => {
    const top = Math.max(
      root.getBoundingClientRect().top,
      root.querySelector('thead')?.getBoundingClientRect().bottom ?? 0,
    );
    const row = Array.from(
      root.querySelectorAll<HTMLElement>('[data-alert-id]'),
    ).find(el => el.getBoundingClientRect().bottom > top)!;
    return {
      id: row.dataset.alertId!,
      offset:
        row.getBoundingClientRect().top - root.getBoundingClientRect().top,
    };
  });
  await bottom(page);
  expect(api.requests).toHaveLength(2);
  api.release();
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(40);
  await expect
    .poll(() =>
      list(page).evaluate((root, anchor) => {
        const row = Array.from(
          root.querySelectorAll<HTMLElement>('[data-alert-id]'),
        ).find(el => el.dataset.alertId === anchor.id)!;
        return Math.abs(
          row.getBoundingClientRect().top -
            root.getBoundingClientRect().top -
            anchor.offset,
        );
      }, anchor),
    )
    .toBeLessThan(2);
  await bottom(page);
  await expect(list(page).getByRole('status')).toHaveText('All alerts loaded');
  expect(api.requests).toHaveLength(2);
});

test('empty and short search results do not fetch more, and clearing search allows scrolling again', async ({
  page,
}) => {
  const api = await fixture(page);
  await openFilters(page);
  const search = page.getByRole('textbox', { name: 'Search alerts' });
  await search.fill('not-present');
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(0);
  await bottom(page);
  expect(api.requests).toHaveLength(1);
  await search.fill('Alert 1-00');
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(1);
  await bottom(page);
  expect(api.requests).toHaveLength(1);
  await search.clear();
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(20);
  await bottom(page);
  await expect.poll(() => api.requests.length).toBe(2);
  api.release();
});

test('a failed page keeps existing results and offers an explicit retry', async ({
  page,
}) => {
  const api = await fixture(page, { failNext: true });
  api.release();
  await bottom(page);
  const retry = list(page).getByRole('button', { name: 'Retry loading' });
  await expect(retry).toBeVisible();
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(20);
  await bottom(page);
  expect(api.requests).toHaveLength(2);
  api.recover();
  await retry.click();
  await expect.poll(() => api.requests.length).toBe(3);
  await list(page).evaluate(el => {
    el.scrollTop = 100;
  });
  const beforeRetry = await list(page).evaluate(root => {
    const top = Math.max(
      root.getBoundingClientRect().top,
      root.querySelector('thead')?.getBoundingClientRect().bottom ?? 0,
    );
    const row = Array.from(
      root.querySelectorAll<HTMLElement>('[data-alert-id]'),
    ).find(el => el.getBoundingClientRect().bottom > top)!;
    return {
      id: row.dataset.alertId!,
      offset:
        row.getBoundingClientRect().top - root.getBoundingClientRect().top,
    };
  });
  // Let the scroll event settle before the network response updates the list.
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  api.release();
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(40);
  expect(api.requests).toHaveLength(3);
  await expect
    .poll(() =>
      list(page).evaluate((root, saved) => {
        const row = Array.from(
          root.querySelectorAll<HTMLElement>('[data-alert-id]'),
        ).find(el => el.dataset.alertId === saved.id)!;
        return Math.abs(
          row.getBoundingClientRect().top -
            root.getBoundingClientRect().top -
            saved.offset,
        );
      }, beforeRetry),
    )
    .toBeLessThan(2);
});

test('a repeated cursor stops automatic pagination', async ({ page }) => {
  const api = await fixture(page, { repeatNext: true });
  api.release();
  await bottom(page);
  await expect(page.getByText(/Pagination stopped because/)).toBeVisible();
  await bottom(page);
  expect(api.requests).toHaveLength(2);
});

test('an overflowing empty-state message never fetches alerts', async ({
  page,
}) => {
  const api = await fixture(page);
  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: 350,
  });
  await openFilters(page);
  await page
    .getByRole('textbox', { name: 'Search alerts' })
    .fill('not-present');
  await expect(
    page.getByRole('button', { name: /View Alert .* details/ }),
  ).toHaveCount(0);
  await bottom(page);
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  expect(api.requests).toHaveLength(1);
  api.release();
});
