import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./lib/toast";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? "";
const ENV = import.meta.env.MODE ?? "development";

// Initialize Sentry for error tracking
if (SENTRY_DSN && ENV === "production") {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [new Sentry.Replay(), new Sentry.BrowserTracing()],
    // Filter out noisy errors
    beforeSend: (event) => {
      // Ignore network errors from cross-origin requests
      if (
        event.exception?.values?.[0]?.type === "NetworkError" ||
        (event.exception?.values?.[0]?.type === "TypeError" &&
          event.exception?.values?.[0]?.value?.includes("NetworkError"))
      ) {
        return null;
      }
      return event;
    },
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Create Sentry-wrapped App component
const SentryApp = () => (
  <React.StrictMode>
    <HelmetProvider>
      <ToastProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <RealtimeProvider>
              <App />
            </RealtimeProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </ToastProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Wrap with Sentry if in production and DSN is configured
const WrappedApp =
  SENTRY_DSN && ENV === "production"
    ? Sentry.withProfiler(SentryApp)
    : SentryApp;

root.render(<WrappedApp />);
