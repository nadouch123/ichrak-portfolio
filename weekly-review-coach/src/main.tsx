import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppCrash, ErrorBoundary } from './failures';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={(_, error) => <AppCrash error={error} />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
