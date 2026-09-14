import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { Alert } from '../lib/types';

const severityColors: Record<NonNullable<Alert['severity']>, ChipProps['color']> = {
  Extreme: 'error',
  Severe: 'error',
  Moderate: 'warning',
  Minor: 'info',
  Unknown: 'default',
};

const SeverityBadge = ({ severity }: { severity: Alert['severity'] }) => {
  return (
    <Chip
      label={severity ?? 'Unknown'}
      color={severityColors[severity ?? 'Unknown']}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};

export default SeverityBadge;
