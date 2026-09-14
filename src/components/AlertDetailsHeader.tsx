import type { Ref } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  onClose: () => void;
  closeLabel: string;
  buttonRef?: Ref<HTMLButtonElement>;
};
const AlertDetailsHeader = ({ onClose, closeLabel, buttonRef }: Props) => (
  <Stack
    direction="row"
    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
  >
    <Typography
      component="h2"
      variant="h2"
      id="alert-details-title"
      sx={{ fontSize: '1.25rem' }}
    >
      Alert details
    </Typography>
    <IconButton ref={buttonRef} onClick={onClose} aria-label={closeLabel}>
      <CloseIcon />
    </IconButton>
  </Stack>
);
export default AlertDetailsHeader;
