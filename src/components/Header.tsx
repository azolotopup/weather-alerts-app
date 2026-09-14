import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatAlertTime } from '../lib/dateUtils';

type Props = {
  updatedAt: number;
  onRefresh: () => void;
  refreshDisabled: boolean;
};

const Header = ({ updatedAt, onRefresh, refreshDisabled }: Props) => {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: { xs: 1.5 }, flexWrap: 'wrap', py: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CloudDoneIcon color="primary" aria-hidden="true" />
          <Typography component="h1" variant="h1" sx={{ fontSize: '1.5rem' }}>
            Weather Alerts
          </Typography>
        </Stack>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', sm: 'block' } }}
        />
        <Tooltip title="Refresh weather alerts">
          <span>
            <IconButton
              color="primary"
              aria-label="Refresh weather alerts"
              onClick={onRefresh}
              disabled={refreshDisabled}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Times shown in your local timezone" describeChild>
          <Typography
            component="time"
            dateTime={updatedAt ? new Date(updatedAt).toISOString() : undefined}
            variant="body2"
            color="text.secondary"
            role="status"
            tabIndex={0}
            sx={{ flex: { xs: 1, md: '0 1 auto' }, minWidth: 0 }}
          >
            <Box
              component="span"
              sx={{ display: { xs: 'block', md: 'inline' } }}
            >
              {updatedAt ? `Updated` : `Not updated yet`}
            </Box>{' '}
            {!!updatedAt && formatAlertTime(updatedAt)}
          </Typography>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
