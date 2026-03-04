import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { initI18n } from '@tripslip/i18n';
import { initMonitoring } from '@tripslip/utils';
import App from './App';
import './index.css';

// Skip env validation for now
// validateEnv(PARENT_APP_ENV);

// Initialize Sentry monitoring if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  initMonitoring({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
}

// Initialize i18n
initI18n();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/parent">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
