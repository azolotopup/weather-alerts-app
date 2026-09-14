import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1200, xl: 1536 },
  },
  shape: { borderRadius: 4 },
  palette: {
    background: { default: '#f5f7fa' },
  },
  components: {
    MuiChip: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: '#f4f7fb', fontWeight: 600 },
      },
    },
  },
});
