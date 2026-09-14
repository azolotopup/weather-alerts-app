import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AlertsPage from './pages/AlertsPage';
import { appTheme } from './theme/appTheme';
import ErrorBoundary from './components/ErrorBoundary';

import './index.css';

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline enableColorScheme />
          <a className="skip-link" href="#main-content">
            Skip to alerts
          </a>
          <ErrorBoundary>
            <AlertsPage />
          </ErrorBoundary>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
export default App;
