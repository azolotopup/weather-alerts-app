import {
  Dialog,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAlertStore } from '../store/alertStore';
import AlertDetails from './AlertDetails';
import AlertDetailsHeader from './AlertDetailsHeader';
import DesktopAlertPanel from './DesktopAlertPanel';

const AlertDetailsDrawer = () => {
  const alertId = useAlertStore(state => state.selectedAlertId);
  const setSelectedAlertId = useAlertStore(state => state.setSelectedAlertId);
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'));
  if (!alertId) return null;
  const close = () => setSelectedAlertId(null);
  if (isDesktop) {
    return (
      <DesktopAlertPanel onClose={close}>
        <AlertDetails alertId={alertId} />
      </DesktopAlertPanel>
    );
  }
  return (
    <Dialog
      open
      fullScreen
      onClose={close}
      aria-labelledby="alert-details-title"
    >
      <DialogTitle component="div">
        <AlertDetailsHeader onClose={close} closeLabel="Back to alerts" />
      </DialogTitle>
      <DialogContent>
        <AlertDetails alertId={alertId} />
      </DialogContent>
    </Dialog>
  );
};
export default AlertDetailsDrawer;
