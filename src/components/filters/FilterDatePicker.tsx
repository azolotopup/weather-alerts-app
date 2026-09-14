import type { Dayjs } from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

type Props = {
  label: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  error?: string;
  helperText: string;
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
  .formatToParts(new Date(2020, 0, 2))
  .map(part => {
    if (part.type === 'year') return 'YYYY';
    if (part.type === 'month') return 'MM';
    if (part.type === 'day') return 'DD';
    return part.value;
  })
  .join('');

const FilterDatePicker = ({
  label,
  value,
  onChange,
  error,
  helperText,
}: Props) => {
  const desktopMediaQuery = useTheme().breakpoints.up('md');

  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      format={dateFormat}
      desktopModeMediaQuery={desktopMediaQuery}
      slotProps={{
        textField: {
          size: 'small',
          fullWidth: true,
          error: Boolean(error),
          helperText: error ?? helperText,
        },
      }}
    />
  );
};

export default FilterDatePicker;
