import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { FILTER_KEYS, FILTER_LABELS } from '../../lib/alerts';
import { formatAlertTime } from '../../lib/dateUtils';
import { formatAreaName } from '../../lib/areas';
import { useAlertStore } from '../../store/alertStore';
import FilterForm from './FilterForm';

const FilterBar = () => {
  const [expanded, setExpanded] = useState(false);
  const desktop = useMediaQuery(useTheme().breakpoints.up('md'));
  const filters = useAlertStore(state => state.activeFilters);
  const apply = useAlertStore(state => state.setActiveFilters);
  const setSearchQuery = useAlertStore(state => state.setSearchQuery);
  const clearFilters = useAlertStore(state => state.clearFilters);
  const chips = FILTER_KEYS.flatMap(key =>
    (filters[key] ?? []).map(value => ({
      id: key + value,
      label: `${FILTER_LABELS[key]}: ${key === 'area' ? formatAreaName(value) : value}`,
      remove: () =>
        apply({
          ...filters,
          [key]: filters[key]?.filter(item => item !== value),
        }),
    })),
  );
  for (const key of ['startTime', 'endTime', 'searchQuery'] as const) {
    if (filters[key])
      chips.push({
        id: key,
        label:
          key === 'searchQuery'
            ? `Search: ${filters[key]}`
            : `${key === 'startTime' ? 'From' : 'Through'}: ${formatAlertTime(filters[key])}`,
        remove: () =>
          key === 'searchQuery'
            ? setSearchQuery(undefined)
            : apply({ ...filters, [key]: undefined }),
      });
  }
  return (
    <Box
      component="section"
      aria-label="Filter weather alerts"
      sx={{
        bgcolor: 'background.paper',
        p: { xs: 2, md: 3 },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {!desktop && (
        <Button
          startIcon={<TuneIcon />}
          aria-expanded={expanded}
          aria-controls="filter-form"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide filters' : 'Show filters'}
        </Button>
      )}
      <Collapse in={desktop || expanded}>
        <Box id="filter-form" sx={{ pt: { xs: 2, md: 0 } }}>
          <FilterForm />
        </Box>
      </Collapse>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1.5, alignItems: 'center' }}
        aria-label="Applied filters"
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ flex: 1, minWidth: 0, overflowX: 'auto', py: 0.5 }}
        >
          {chips.length ? (
            chips.map(chip => (
              <Chip
                key={chip.id}
                label={chip.label}
                onDelete={chip.remove}
                size="small"
              />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              No filters applied
            </Typography>
          )}
        </Stack>
        <Button
          size="small"
          onClick={clearFilters}
          disabled={!chips.length}
          sx={{ flexShrink: 0 }}
        >
          Clear filters
        </Button>
      </Stack>
    </Box>
  );
};

export default FilterBar;
