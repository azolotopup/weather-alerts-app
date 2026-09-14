import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Skeleton } from '@mui/material';
import { alertDetailsOptions } from '../api/weatherQueries';
import AlertDetailsContent from './AlertDetailsContent';

const AlertDetails = ({ alertId }: { alertId: string }) => {
  const details = useQuery(alertDetailsOptions(alertId));

  if (details.isPending) {
    return (
      <Box aria-label="Loading alert details">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height={60} />
        ))}
      </Box>
    );
  }

  if (details.isError) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => void details.refetch()}>Retry</Button>}
      >
        {details.error.message}
      </Alert>
    );
  }

  return <AlertDetailsContent alert={details.data} />;
};
export default AlertDetails;
