import { Typography } from '@mui/material';
import { getSearchExcerpt } from '../lib/alerts';
import type { Alert } from '../lib/types';

interface SearchExcerptProps {
  alert: Alert;
  search: string;
}

const SearchExcerpt = ({ alert, search }: SearchExcerptProps) => {
  const excerpt = getSearchExcerpt(alert, search);
  if (!excerpt) {
    return null;
  }

  const term = search.trim();
  const start = excerpt.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if (start < 0) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        component="p"
        sx={{ mt: 0.5 }}
      >
        {excerpt}
      </Typography>
    );
  }
  const end = start + term.length;

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      component="p"
      sx={{ mt: 0.5 }}
    >
      {excerpt.slice(0, start)}
      <mark className="search-match">{excerpt.slice(start, end)}</mark>
      {excerpt.slice(end)}
    </Typography>
  );
};

export default SearchExcerpt;
