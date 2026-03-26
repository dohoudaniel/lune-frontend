/**
 * Dev-only logger — all calls are no-ops in production builds.
 * Use this instead of console.log / console.error / console.warn
 * to prevent internal details from appearing in browser DevTools for end users.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log:  (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  // error() always logs the message string, but only logs the full error object in dev
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(message, error);
    } else if (error instanceof Error) {
      console.error(message, error.message);
    } else {
      console.error(message);
    }
  },
};
