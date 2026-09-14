import dayjs, { type Dayjs } from 'dayjs';

export const formatAlertTime = (value?: string | number | null): string => {
  if (!value) return 'Not available';
  const date = dayjs(value);
  if (!date.isValid()) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date.toDate());
};

export const formatAlertDate = (value?: string | null): string => {
  if (!value) return 'Not available';
  const date = dayjs(value);
  if (!date.isValid()) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date.toDate());
};

export const startOfLocalDay = (value: string | Dayjs): string =>
  dayjs(value).startOf('day').toISOString();

export const endOfLocalDay = (value: string | Dayjs): string =>
  dayjs(value).endOf('day').toISOString();
