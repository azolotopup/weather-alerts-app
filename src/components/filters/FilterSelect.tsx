import { Autocomplete, TextField } from '@mui/material';

interface Props {
  label: string;
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
  freeSolo?: boolean;
  getOptionLabel?: (option: string) => string;
}
const FilterSelect = ({ label, options, value, onChange, freeSolo = false, getOptionLabel }: Props) => {
  return (
    <Autocomplete
      multiple
      freeSolo={freeSolo}
      size="small"
      options={options}
      value={value}
      onChange={(_, values) => onChange(values)}
      getOptionLabel={getOptionLabel}
      filterSelectedOptions
      renderInput={params => <TextField {...params} label={label} />}
    />
  );
};

export default FilterSelect;
