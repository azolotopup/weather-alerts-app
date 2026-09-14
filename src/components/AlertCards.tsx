import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { formatAlertTime } from '../lib/dateUtils';
import type { Alert } from '../lib/types';
import SearchExcerpt from './SearchExcerpt';
import SeverityBadge from './SeverityBadge';

type Props = {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
};

const AlertCards = ({ alerts, selectedId, onSelect, search }: Props) => (
  <Stack
    component="ul"
    spacing={1.5}
    aria-label="Weather alert results"
    sx={{ m: 0, p: 0, listStyle: 'none' }}
  >
    {alerts.map(alert => (
      <Box component="li" key={alert.id} data-alert-id={alert.id}>
        <Card
          variant="outlined"
          sx={{
            borderColor: alert.id === selectedId ? 'primary.main' : 'divider',
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Button
                onClick={() => onSelect(alert.id)}
                sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 0 }}
                aria-label={`View ${alert.event ?? 'alert'} details`}
              >
                {alert.event ?? 'Weather alert'}
              </Button>
              <SeverityBadge severity={alert.severity} />
            </Stack>
            <Typography variant="body2" sx={{ my: 1 }}>
              {alert.areaDesc ?? 'Area not available'}
            </Typography>
            <SearchExcerpt alert={alert} search={search} />
            <Typography variant="caption" color="text.secondary" component="p">
              Issued {formatAlertTime(alert.sent)}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              Expires {formatAlertTime(alert.expires)}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    ))}
  </Stack>
);

export default AlertCards;
