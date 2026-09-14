import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { WeatherApiError } from '../api/weatherApi';
import FilterBar from '../components/filters/FilterBar';
import AlertResults from '../components/AlertResults';
import AlertDetailsDrawer from '../components/AlertDetailsDrawer';
import { useWeatherAlerts } from '../hooks/useWeatherAlerts';
import { useAlertStore } from '../store/alertStore';
import Header from '../components/Header';

const AlertsPage = () => {
  const filters = useAlertStore(state => state.activeFilters);
  const setSelectedAlertId = useAlertStore(state => state.setSelectedAlertId);
  const collection = useWeatherAlerts(filters);
  const [expiredDeadline, setExpiredDeadline] = useState<number>();
  const retryAt =
    collection.error instanceof WeatherApiError &&
    collection.error.status === 429
      ? collection.error.retryAt
      : 0;
  const retryBlocked = retryAt !== expiredDeadline && retryAt > Date.now();

  useEffect(() => {
    if (retryAt <= Date.now()) return;
    const timer = window.setTimeout(
      () => setExpiredDeadline(retryAt),
      retryAt - Date.now(),
    );
    return () => window.clearTimeout(timer);
  }, [retryAt]);

  const refreshAlerts = () => {
    setSelectedAlertId(null);
    void collection.refresh();
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: { md: '100dvh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: { md: 'hidden' },
      }}
    >
      <Header
        updatedAt={collection.updatedAt}
        onRefresh={refreshAlerts}
        refreshDisabled={collection.isFetching || retryBlocked}
      />
      <Box
        component="main"
        id="main-content"
        sx={{
          bgcolor: 'background.default',
          flex: 1,
          minHeight: { md: 0 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            maxHeight: { md: '48dvh' },
            overflowY: { md: 'auto' },
          }}
        >
          <FilterBar />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            minWidth: 0,
            minHeight: { md: 0 },
            flex: { md: 1 },
            gap: 2,
            px: { xs: 2, md: 3 },
            pb: 2,
          }}
        >
          <AlertResults
            collection={collection}
            retryAt={retryAt}
            retryBlocked={retryBlocked}
          />
          <AlertDetailsDrawer />
        </Box>
      </Box>
    </Box>
  );
};

export default AlertsPage;
