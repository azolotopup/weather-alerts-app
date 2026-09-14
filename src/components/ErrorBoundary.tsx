import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { Alert, Button } from '@mui/material';

interface ErrorBoundaryState {
  failed: boolean;
}

export default class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Alert page rendering failed', error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <Alert
        severity="error"
        action={
          <Button onClick={() => this.setState({ failed: false })}>Try again</Button>
        }
      >
        The alert view could not be displayed.
      </Alert>
    );
  }
}
