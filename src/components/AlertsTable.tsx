import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import type { Alert, SortConfig } from '../lib/types';
import { formatAlertTime } from '../lib/dateUtils';
import { ALERT_COLUMNS, defaultSortDirection } from '../lib/alertColumns';
import SeverityBadge from './SeverityBadge';
import SearchExcerpt from './SearchExcerpt';

interface AlertsTableProps {
  alerts: Alert[];
  sort: SortConfig;
  onSort: (sort: SortConfig) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
}
const AlertsTable = ({
  alerts,
  sort,
  onSort,
  selectedId,
  onSelect,
  search,
}: AlertsTableProps) => {
  const sortByColumn = (column: SortConfig['column']) => {
    if (sort.column === column) {
      onSort({ column, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
      return;
    }
    onSort({ column, direction: defaultSortDirection(column) });
  };

  return (
    <Table
      stickyHeader
      aria-label="Weather alerts"
      aria-rowcount={alerts.length + 1}
      sx={{ tableLayout: 'fixed' }}
    >
      <TableHead>
        <TableRow>
          {ALERT_COLUMNS.map(({ column, label }) => (
            <TableCell
              key={column}
              scope="col"
              sortDirection={sort.column === column ? sort.direction : false}
              sx={{
                width:
                  column === 'area'
                    ? '30%'
                    : column === 'severity'
                      ? '13%'
                      : '19%',
              }}
            >
              <TableSortLabel
                active={sort.column === column}
                direction={sort.column === column ? sort.direction : 'asc'}
                onClick={() => sortByColumn(column)}
              >
                {label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {alerts.map((alert, index) => (
          <TableRow
            hover
            key={alert.id}
            data-alert-id={alert.id}
            selected={alert.id === selectedId}
            aria-rowindex={index + 2}
            onClick={() => onSelect(alert.id)}
            sx={{
              cursor: 'pointer',
              '& td, & th': { verticalAlign: 'top', overflowWrap: 'anywhere' },
            }}
          >
            <TableCell component="th" scope="row">
              <Button
                onClick={event => {
                  event.stopPropagation();
                  onSelect(alert.id);
                }}
                sx={{ textAlign: 'left', p: 0, justifyContent: 'flex-start' }}
                aria-label={`View ${alert.event ?? 'alert'} details`}
              >
                {alert.event ?? 'Weather alert'}
              </Button>
              <SearchExcerpt alert={alert} search={search} />
            </TableCell>
            <TableCell>
              <SeverityBadge severity={alert.severity} />
            </TableCell>
            <TableCell>{alert.areaDesc ?? 'Area not available'}</TableCell>
            <TableCell>
              <Box component="time" dateTime={alert.sent}>
                {formatAlertTime(alert.sent)}
              </Box>
            </TableCell>
            <TableCell>
              <Box component="time" dateTime={alert.expires}>
                {formatAlertTime(alert.expires)}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AlertsTable;
