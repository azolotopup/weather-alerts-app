import {
  Alert as Notice,
  Box,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import type { Alert } from '../lib/types';
import { formatAlertTime } from '../lib/dateUtils';
import SeverityBadge from './SeverityBadge';

const AlertDetailsContent = ({ alert }: { alert: Alert }) => {
  const timeline = [
    ['Issued', alert.sent],
    ['Effective', alert.effective],
    ['Onset', alert.onset],
    ['Expires', alert.expires],
    ['Ends', alert.ends],
  ];
  const safeLink =
    alert.web && /^https?:\/\//i.test(alert.web) ? alert.web : undefined;
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <SeverityBadge severity={alert.severity} />
        <Typography variant="body2">
          {alert.status ?? 'Status unknown'}
          {alert.messageType ? ` · ${alert.messageType}` : ''}
        </Typography>
      </Stack>
      <Box>
        <Typography variant="h3" component="h3" sx={{ fontSize: '1.25rem' }}>
          {alert.event ?? 'Weather alert'}
        </Typography>
        <Typography sx={{ mt: 1 }}>
          {alert.areaDesc ?? 'Area not available'}
        </Typography>
      </Box>
      {alert.headline && (
        <Typography sx={{ fontWeight: 600 }}>{alert.headline}</Typography>
      )}
      <Notice severity="info" icon={false}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>What to do</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {alert.instruction || 'No additional instructions were provided.'}
        </Typography>
      </Notice>
      <Box>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          Alert description
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
          {alert.description || 'No description was provided.'}
        </Typography>
      </Box>
      {alert.note && <Notice severity="warning">{alert.note}</Notice>}
      <Divider />
      <Box component="dl" sx={{ m: 0 }}>
        {timeline.map(([label, value]) => (
          <Box key={label} sx={{ mb: 1.5 }}>
            <Typography component="dt" variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography component="dd" sx={{ m: 0 }}>
              {formatAlertTime(value)}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="body2">
        Urgency: {alert.urgency ?? 'Unknown'} · Certainty:{' '}
        {alert.certainty ?? 'Unknown'}
      </Typography>
      {alert.senderName && (
        <Typography variant="body2" color="text.secondary">
          Issued by {alert.senderName}
        </Typography>
      )}
      {safeLink && (
        <Link href={safeLink} target="_blank" rel="noopener noreferrer">
          View official alert resource
        </Link>
      )}
    </Stack>
  );
};

export default AlertDetailsContent;
