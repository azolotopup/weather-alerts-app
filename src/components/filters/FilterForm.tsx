import { useEffect, useRef, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, TextField } from '@mui/material';
import { alertEventTypesOptions } from '../../api/weatherQueries';
import {
  FILTER_KEYS,
  FILTER_LABELS,
  FILTER_OPTIONS,
  validateDateRange,
} from '../../lib/alerts';
import { endOfLocalDay, startOfLocalDay } from '../../lib/dateUtils';
import { formatAreaName } from '../../lib/areas';
import type { AlertFilters } from '../../lib/types';
import { useAlertStore } from '../../store/alertStore';
import FilterDatePicker from './FilterDatePicker';
import FilterSelect from './FilterSelect';

type FilterValues = Omit<
  Required<AlertFilters>,
  'startTime' | 'endTime' | 'searchQuery'
> & {
  startTime: Dayjs | null;
  endTime: Dayjs | null;
};

const selectedDate = (date: Dayjs | null): string | undefined => {
  if (!date) return undefined;
  return date.isValid() ? date.format('YYYY-MM-DD') : 'invalid';
};

const formValues = (filters: AlertFilters): FilterValues => {
  return {
    area: filters.area ?? [],
    event: filters.event ?? [],
    severity: filters.severity ?? [],
    status: filters.status ?? [],
    certainty: filters.certainty ?? [],
    urgency: filters.urgency ?? [],
    startTime: filters.startTime ? dayjs(filters.startTime) : null,
    endTime: filters.endTime ? dayjs(filters.endTime) : null,
  };
};

const apiValues = (values: FilterValues): Omit<AlertFilters, 'searchQuery'> => {
  const { startTime, endTime, ...rest } = values;
  return {
    ...rest,
    startTime: startTime ? startOfLocalDay(startTime) : undefined,
    endTime: endTime ? endOfLocalDay(endTime) : undefined,
  };
};

const FilterForm = () => {
  const revision = useAlertStore(state => state.filterDraftRevision);
  return <FilterDraft key={revision} revision={revision} />;
};

const FilterDraft = ({ revision }: { revision: number }) => {
  const activeFilters = useAlertStore(state => state.activeFilters);
  const commitApiFilters = useAlertStore(state => state.commitApiFilters);
  const searchQuery = useAlertStore(
    state => state.activeFilters.searchQuery ?? '',
  );
  const setSearchQuery = useAlertStore(state => state.setSearchQuery);
  const [values, setValues] = useState(() => formValues(activeFilters));
  const dateError = validateDateRange(
    selectedDate(values.startTime),
    selectedDate(values.endTime),
  );
  const pending = useRef<number | undefined>(undefined);

  // External clear/remove actions remount the draft and cancel pending commits.
  useEffect(() => () => window.clearTimeout(pending.current), []);

  const events = useQuery(alertEventTypesOptions());

  const change = (next: FilterValues) => {
    setValues(next);
    window.clearTimeout(pending.current);

    const error = validateDateRange(
      selectedDate(next.startTime),
      selectedDate(next.endTime),
    );
    if (error) {
      return;
    }

    pending.current = window.setTimeout(
      () => commitApiFilters(apiValues(next), revision),
      300,
    );
  };

  const startError =
    values.startTime && !values.startTime.isValid() ? dateError : undefined;
  const endError =
    values.endTime && !values.endTime.isValid()
      ? dateError
      : startError
        ? undefined
        : dateError;

  return (
    <Box
      component="form"
      onSubmit={event => event.preventDefault()}
      noValidate
      aria-label="Alert filters"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {FILTER_KEYS.map(key => (
          <FilterSelect
            key={key}
            label={FILTER_LABELS[key]}
            options={
              key === 'event' ? (events.data ?? []) : FILTER_OPTIONS[key]
            }
            value={values[key]}
            onChange={selected => change({ ...values, [key]: selected })}
            freeSolo={key === 'event'}
            getOptionLabel={key === 'area' ? formatAreaName : undefined}
          />
        ))}

        {(['startTime', 'endTime'] as const).map(key => (
          <FilterDatePicker
            key={key}
            label={key === 'startTime' ? 'Issued from' : 'Issued through'}
            value={values[key]}
            onChange={date => change({ ...values, [key]: date })}
            error={key === 'startTime' ? startError : endError}
            helperText={
              key === 'endTime' ? 'Inclusive local date' : 'Local date'
            }
          />
        ))}

        <TextField
          size="small"
          label="Search alerts"
          placeholder="Event, place, or alert text"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          sx={{ gridColumn: { md: 'span 2' } }}
        />
      </Box>

      {events.isError && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Event suggestions are unavailable. You can still type an event name
          and press Enter.
        </Alert>
      )}
    </Box>
  );
};

export default FilterForm;
