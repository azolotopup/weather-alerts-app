import dayjs, { type Dayjs } from 'dayjs';

type DateValue = string | number | null | undefined;
const displayDate = (value: DateValue) => {
  if (value === undefined || value === null || value === '') return null;
  const date = dayjs(value).locale('en');
  return date.isValid() ? date : null;
};

export const formatAlertTime = (value?: DateValue): string =>
  displayDate(value)?.format('D MMM YYYY, HH:mm') ?? 'Not available';

export const startOfLocalDay = (value: string | Dayjs): string =>
  dayjs(value).startOf('day').toISOString();

export const endOfLocalDay = (value: string | Dayjs): string =>
  dayjs(value).endOf('day').toISOString();
