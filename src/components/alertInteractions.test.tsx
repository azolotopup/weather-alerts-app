import { afterEach, beforeEach, expect, test } from 'bun:test';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { appTheme } from '../theme/appTheme';
import { useAlertStore } from '../store/alertStore';
import FilterForm from './filters/FilterForm';
import CollectionNotice from './CollectionNotice';
import DesktopAlertPanel from './DesktopAlertPanel';
import type { useWeatherAlerts } from '../hooks/useWeatherAlerts';

beforeEach(() => useAlertStore.getState().clearFilters());
afterEach(cleanup);

const renderFilters = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(['alertEventTypes'], ['Flood Warning']);
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={appTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FilterForm />
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

test('search remains usable while the date draft is invalid', async () => {
  useAlertStore
    .getState()
    .setActiveFilters({ startTime: '2026-09-15', endTime: '2026-09-14' });
  renderFilters();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Search alerts' }),
    'flood',
  );
  expect(useAlertStore.getState().activeFilters.searchQuery).toBe('flood');
  expect(
    screen.getByText('The end date must be on or after the start date.'),
  ).toBeTruthy();
});

test('a pending API filter commit preserves the latest search', () => {
  const store = useAlertStore.getState();
  store.setSearchQuery('wind');
  store.commitApiFilters({ area: ['CA'] }, store.filterDraftRevision);
  expect(useAlertStore.getState().activeFilters).toEqual({
    area: ['CA'],
    searchQuery: 'wind',
  });
});

test('clear and external filter removal invalidate older draft commits', () => {
  const pendingRevision = useAlertStore.getState().filterDraftRevision;
  useAlertStore.getState().clearFilters();
  useAlertStore.getState().commitApiFilters({ area: ['CA'] }, pendingRevision);
  expect(useAlertStore.getState().activeFilters).toEqual({});
  const nextRevision = useAlertStore.getState().filterDraftRevision;
  useAlertStore.getState().setActiveFilters({ severity: ['Severe'] });
  useAlertStore.getState().commitApiFilters({ area: ['CA'] }, nextRevision);
  expect(useAlertStore.getState().activeFilters).toEqual({
    severity: ['Severe'],
  });
});

test('clearing filters resets the visible search and date error', async () => {
  useAlertStore
    .getState()
    .setActiveFilters({
      searchQuery: 'wind',
      startTime: '2026-09-15',
      endTime: '2026-09-14',
    });
  renderFilters();
  act(() => useAlertStore.getState().clearFilters());
  expect(
    screen
      .getByRole('textbox', { name: 'Search alerts' })
      .getAttribute('value'),
  ).toBe('');
  expect(
    screen.queryByText('The end date must be on or after the start date.'),
  ).toBeNull();
});

test('initially paused requests explain why loading has not completed', () => {
  const collection = {
    alerts: [],
    error: null,
    hasMore: false,
    isLoading: true,
    isFetching: false,
    isPaused: true,
    updatedAt: 0,
    loadMore: async () => {},
    retry: async () => {},
    refresh: async () => {},
  } satisfies ReturnType<typeof useWeatherAlerts>;
  render(
    <CollectionNotice
      collection={collection}
      retryAt={0}
      retryBlocked={false}
    />,
  );
  expect(screen.getByRole('status').textContent).toContain(
    'Waiting for a connection.',
  );
});

test('desktop details focus returns to the opener after Escape', async () => {
  const user = userEvent.setup();
  let closed = false;
  const opener = document.createElement('button');
  opener.textContent = 'Open details';
  document.body.append(opener);
  opener.focus();
  const view = render(
    <DesktopAlertPanel
      onClose={() => {
        closed = true;
      }}
    >
      Details
    </DesktopAlertPanel>,
  );
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Close alert details' }),
  );
  await user.keyboard('{Escape}');
  expect(closed).toBe(true);
  view.unmount();
  expect(document.activeElement).toBe(opener);
  opener.remove();
});
