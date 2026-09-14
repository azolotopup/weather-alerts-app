import { Button, MenuItem, Stack, TextField } from '@mui/material';
import type { SortConfig } from '../lib/types';
import { ALERT_COLUMNS, defaultSortDirection } from '../lib/alertColumns';

type Props = {
  sort: SortConfig;
  onSort: (sort: SortConfig) => void;
};

const MobileSortControls = ({ sort, onSort }: Props) => (
  <Stack direction="row" sx={{ pb: 2, gap: 1 }}>
    <TextField
      select
      label="Sort by"
      size="small"
      value={sort.column}
      onChange={event =>
        onSort({
          column: event.target.value as SortConfig['column'],
          direction: defaultSortDirection(
            event.target.value as SortConfig['column'],
          ),
        })
      }
      sx={{ flex: 1 }}
    >
      {ALERT_COLUMNS.map(column => (
        <MenuItem key={column.column} value={column.column}>
          {column.label}
        </MenuItem>
      ))}
    </TextField>
    <Button
      variant="outlined"
      aria-label="Toggle sort direction"
      onClick={() =>
        onSort({
          ...sort,
          direction: sort.direction === 'asc' ? 'desc' : 'asc',
        })
      }
    >
      {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
    </Button>
  </Stack>
);

export default MobileSortControls;
