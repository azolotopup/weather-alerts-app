import { useEffect, useState } from 'react';
import { Alert, Box, Button, LinearProgress, Typography } from '@mui/material';
import type { useWeatherAlerts } from '../hooks/useWeatherAlerts';

const RetryCountdown = ({ retryAt }: { retryAt: number }) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (retryAt <= Date.now()) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= retryAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const seconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return seconds > 0 ? <> Try again in {seconds}s.</> : null;
};

type Props = {
  collection: ReturnType<typeof useWeatherAlerts>;
  retryAt: number;
  retryBlocked: boolean;
};

const CollectionNotice = ({ collection, retryAt, retryBlocked }: Props) => {
  if (collection.error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button
            color="inherit"
            disabled={retryBlocked}
            onClick={() => void collection.retry()}
          >
            Retry loading
          </Button>
        }
      >
        {collection.error.message}{' '}
        {collection.alerts.length > 0 && 'More results may be available.'}
        {retryBlocked && <RetryCountdown retryAt={retryAt} />}
      </Alert>
    );
  }
  // A request can be paused before its first response, while still pending.
  const message = collection.isPaused
    ? 'Waiting for a connection.'
    : collection.isFetching && !collection.isLoading
      ? 'Loading alerts…'
      : null;
  if (!message) return null;
  return (
    <Box sx={{ mx: 2, my: 2 }} role="status">
      <Typography variant="body2" sx={{ mb: 1 }}>
        {message}
      </Typography>
      {!collection.isPaused && (
        <LinearProgress aria-label="Loading alert collection" />
      )}
    </Box>
  );
};
export default CollectionNotice;
