import { useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { selectAlerts } from '../lib/alerts';
import { useAlertStore } from '../store/alertStore';
import type { useWeatherAlerts } from '../hooks/useWeatherAlerts';
import AlertsTable from './AlertsTable';
import AlertCards from './AlertCards';
import CollectionNotice from './CollectionNotice';
import { useAlertScroll } from '../hooks/useAlertScroll';
import MobileSortControls from './MobileSortControls';

type Props = {
  collection: ReturnType<typeof useWeatherAlerts>;
  retryAt: number;
  retryBlocked: boolean;
};

const AlertResults = ({ collection, retryAt, retryBlocked }: Props) => {
  const filters = useAlertStore(state => state.activeFilters);
  const sort = useAlertStore(state => state.sortConfig);
  const setSortConfig = useAlertStore(state => state.setSortConfig);
  const selectedAlertId = useAlertStore(state => state.selectedAlertId);
  const setSelectedAlertId = useAlertStore(state => state.setSelectedAlertId);
  const clearFilters = useAlertStore(state => state.clearFilters);
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'));
  const matches = useMemo(
    () => selectAlerts(collection.alerts, filters.searchQuery ?? '', sort),
    [collection.alerts, filters.searchQuery, sort],
  );
  const canPaginate = collection.hasMore && !collection.error;
  const { scrollRef, onScroll } = useAlertScroll({
    alerts: matches,
    viewKey: JSON.stringify([filters, sort]),
    enabled:
      canPaginate &&
      !collection.isFetching &&
      !collection.isPaused &&
      !retryBlocked,
    loadMore: collection.loadMore,
  });
  const ResultsView = isDesktop ? AlertsTable : AlertCards;
  const emptyMessage = collection.error
    ? 'The search could not be completed.'
    : collection.hasMore
      ? 'No loaded alerts match your filters. Clear search to browse more alerts.'
      : 'No weather alerts match your filters.';

  return (
    <Box
      component="section"
      aria-label="Alert results"
      sx={{
        minWidth: 0,
        minHeight: { md: 0 },
        flex: 1,
        display: { md: 'flex' },
        flexDirection: { md: 'column' },
      }}
    >
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" role="status">
          {collection.isLoading ? (
            'Loading alerts…'
          ) : (
            <>
              <strong>{matches.length}</strong> of {collection.alerts.length}{' '}
              entries
            </>
          )}
        </Typography>
      </Box>
      {!isDesktop && <MobileSortControls sort={sort} onSort={setSortConfig} />}
      <Paper
        variant="outlined"
        sx={{
          minWidth: 0,
          minHeight: { md: 0 },
          flex: { md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          overflow: 'hidden',
          borderRadius: '4px',
          bgcolor: 'background.paper',
        }}
      >
        {!collection.alerts.length && (
          <CollectionNotice
            collection={collection}
            retryAt={retryAt}
            retryBlocked={retryBlocked}
          />
        )}
        <Box
          sx={{ position: 'relative', flex: { md: 1 }, minHeight: { md: 0 } }}
        >
          <Box
            id="alerts-scroll"
            ref={scrollRef}
            onScroll={onScroll}
            role="region"
            aria-label="Scrollable weather alerts"
            tabIndex={0}
            sx={{
              maxHeight: { xs: '65dvh', md: 'none' },
              height: { md: '100%' },
              minHeight: { xs: matches.length ? 160 : 0, md: 0 },
              overflowY: 'auto',
              overflowAnchor: 'none',
              px: { xs: 2, md: 0 },
              pt: { xs: 2, md: 0 },
              pb: { xs: 2, md: 0 },
            }}
          >
            {collection.isLoading && !collection.error && (
              <Box aria-label="Loading alerts">
                {Array.from({ length: 10 }, (_, index) => (
                  <Skeleton key={index} height={48} />
                ))}
              </Box>
            )}
            {!collection.isLoading && !matches.length && (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
                {!collection.hasMore && !collection.error && (
                  <Button onClick={clearFilters}>Clear filters</Button>
                )}
              </Box>
            )}
            {matches.length > 0 && (
              <ResultsView
                alerts={matches}
                sort={sort}
                onSort={setSortConfig}
                selectedId={selectedAlertId}
                onSelect={setSelectedAlertId}
                search={filters.searchQuery ?? ''}
              />
            )}
            {collection.alerts.length > 0 && (
              <CollectionNotice
                collection={collection}
                retryAt={retryAt}
                retryBlocked={retryBlocked}
              />
            )}
            {!collection.isLoading &&
              !collection.isFetching &&
              !collection.isPaused &&
              !collection.error && (
                <Typography
                  role="status"
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', p: 2 }}
                >
                  {collection.hasMore
                    ? 'Scroll down to load more alerts'
                    : 'All alerts loaded'}
                </Typography>
              )}
          </Box>
        </Box>
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {isDesktop
              ? 'Select a row to view details · Scroll within the table'
              : 'Select an alert to view details'}
          </Typography>
          {canPaginate && (
            <Typography variant="caption" color="text.secondary">
              More alerts may be available. Search and sorting use loaded alerts
              only.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AlertResults;
