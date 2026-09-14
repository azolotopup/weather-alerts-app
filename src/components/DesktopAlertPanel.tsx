import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Box } from '@mui/material';
import AlertDetailsHeader from './AlertDetailsHeader';

const DesktopAlertPanel = ({
  children,
  onClose,
}: PropsWithChildren<{ onClose: () => void }>) => {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButton.current?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <Box
      component="aside"
      aria-labelledby="alert-details-title"
      sx={{
        width: '32%',
        minWidth: 300,
        maxWidth: 520,
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        p: 2.5,
        overflowWrap: 'anywhere',
      }}
    >
      <AlertDetailsHeader
        onClose={onClose}
        closeLabel="Close alert details"
        buttonRef={closeButton}
      />
      <Box sx={{ mt: 2, minHeight: 0, flex: 1, overflowY: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};
export default DesktopAlertPanel;
