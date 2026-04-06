/**
 * Error Message Sanitizer
 *
 * Prevents sensitive information (emails, tokens, IDs, API details) from leaking
 * through error messages displayed to users via toast notifications.
 *
 * @module errorSanitizer
 */

/**
 * Patterns to detect and redact in error messages
 */
const SENSITIVE_PATTERNS = {
  EMAIL: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  UUID: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  API_ENDPOINT: /\/api\/[a-zA-Z0-9\-_\/]+/g,
  TOKEN: /token[:\s=]+[a-zA-Z0-9._-]+/gi,
  SECRET: /secret[:\s=]+[a-zA-Z0-9._-]+/gi,
  API_KEY: /api[_-]?key[:\s=]+[a-zA-Z0-9._-]+/gi,
  DATABASE_URL: /postgresql:\/\/.*?@.*?\/[a-zA-Z0-9_-]+/g,
  FILE_PATH: /\/[a-zA-Z0-9_\-/.]+\.(log|env|conf|config|json|yaml|yml)/g,
  INTERNAL_IP: /\b(?:192\.168|10\.0|172\.16)\.[0-9.]+\b/g,
};

/**
 * Safe authentication error messages
 * Only show these specific messages to users
 */
const AUTH_SAFE_MESSAGES: Record<string, string> = {
  'invalid credentials': 'Email or password is incorrect',
  'invalid email or password': 'Email or password is incorrect',
  'user not found': 'No account found with this email address',
  'user does not exist': 'No account found with this email address',
  'email already exists': 'This email is already registered',
  'email already in use': 'This email is already registered',
  'email not verified': 'Please verify your email address first',
  'email verification required': 'Please verify your email address first',
  'account disabled': 'This account has been disabled',
  'account locked': 'This account has been temporarily locked. Please try again later',
  'too many login attempts': 'Too many failed login attempts. Please try again later',
  'password too weak': 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols',
  'password does not meet requirements': 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols',
  'old password incorrect': 'Your current password is incorrect',
  'passwords do not match': 'Passwords do not match',
  'token expired': 'Your session has expired. Please log in again',
  'invalid token': 'Authentication token is invalid. Please log in again',
};

/**
 * Safe validation error messages
 */
const VALIDATION_SAFE_MESSAGES: Record<string, string> = {
  'field required': 'This field is required',
  'invalid email format': 'Please enter a valid email address',
  'invalid phone number': 'Please enter a valid phone number',
  'value too long': 'This value is too long',
  'value too short': 'This value is too short',
  'invalid date': 'Please enter a valid date',
  'invalid number': 'Please enter a valid number',
  'file too large': 'File size exceeds the maximum allowed limit',
  'file type not allowed': 'This file type is not allowed',
  'invalid image': 'Please upload a valid image file',
};

/**
 * Generic fallback messages by error type
 */
const GENERIC_MESSAGES: Record<string, string> = {
  '400': 'Invalid request. Please check your input and try again',
  '401': 'You need to log in to continue',
  '403': 'You do not have permission to access this resource',
  '404': 'The requested resource was not found',
  '409': 'This action conflicts with existing data',
  '422': 'Invalid data provided. Please check your input',
  '429': 'Too many requests. Please wait a moment and try again',
  '500': 'A server error occurred. Please try again later',
  '502': 'Service temporarily unavailable. Please try again later',
  '503': 'Service is under maintenance. Please try again later',
  'network': 'Network error. Please check your connection',
  'timeout': 'Request timed out. Please try again',
};

/**
 * Redact sensitive patterns from a string
 * @param text - The text to sanitize
 * @returns The sanitized text with sensitive data removed
 */
function redactSensitivePatterns(text: string): string {
  let sanitized = text;

  // Redact emails
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, '[email]');

  // Redact UUIDs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.UUID, '[id]');

  // Redact API endpoints
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_ENDPOINT, '[endpoint]');

  // Redact tokens and secrets
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.TOKEN, 'token=[redacted]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.SECRET, 'secret=[redacted]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_KEY, 'api_key=[redacted]');

  // Redact database URLs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.DATABASE_URL, '[database_url]');

  // Redact file paths to sensitive files
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.FILE_PATH, '[file]');

  // Redact internal IPs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.INTERNAL_IP, '[ip]');

  return sanitized;
}

/**
 * Extract error message from various error objects
 * @param error - The error object (axios error, Error, or any object)
 * @returns The extracted error message
 */
function extractErrorMessage(error: unknown): string {
  // Axios error response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    if (axiosError.response?.data?.detail) {
      return String(axiosError.response.data.detail);
    }
    if (axiosError.response?.data?.message) {
      return String(axiosError.response.data.message);
    }
    if (axiosError.response?.data?.error) {
      return String(axiosError.response.data.error);
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // Generic object
  if (error && typeof error === 'object') {
    if ('message' in error) {
      return String((error as any).message);
    }
    if ('detail' in error) {
      return String((error as any).detail);
    }
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Get HTTP status code from error
 * @param error - The error object
 * @returns The HTTP status code or undefined
 */
function getStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return axiosError.response?.status;
  }
  return undefined;
}

/**
 * Check if an error message is safe to display as-is
 * @param message - The error message to check
 * @param category - The error category (auth, validation, generic)
 * @returns True if the message is safe, false otherwise
 */
function isSafeMessage(message: string, category: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  if (category === 'auth') {
    return Object.keys(AUTH_SAFE_MESSAGES).some(
      (safeMsg) => lowerMessage.includes(safeMsg.toLowerCase())
    );
  }

  if (category === 'validation') {
    return Object.keys(VALIDATION_SAFE_MESSAGES).some(
      (safeMsg) => lowerMessage.includes(safeMsg.toLowerCase())
    );
  }

  return false;
}

/**
 * Get a safe error message from a safe messages map
 * @param message - The original error message
 * @param safeMap - The map of safe messages
 * @returns The safe message or undefined if not found
 */
function getSafeMessage(message: string, safeMap: Record<string, string>): string | undefined {
  const lowerMessage = message.toLowerCase().trim();

  for (const [key, safeMsg] of Object.entries(safeMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return safeMsg;
    }
  }

  return undefined;
}

/**
 * Classify error type for better message selection
 * @param error - The error object
 * @returns The error category: 'auth', 'validation', 'network', or 'generic'
 */
function classifyError(error: unknown): string {
  const message = extractErrorMessage(error).toLowerCase();
  const status = getStatusCode(error);

  // Network errors
  if (status === undefined || message.includes('network') || message.includes('fetch')) {
    return 'network';
  }

  // Authentication errors
  if (
    status === 401 ||
    status === 403 ||
    message.includes('auth') ||
    message.includes('login') ||
    message.includes('password') ||
    message.includes('credential') ||
    message.includes('token')
  ) {
    return 'auth';
  }

  // Validation errors
  if (
    status === 400 ||
    status === 422 ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('validation')
  ) {
    return 'validation';
  }

  return 'generic';
}

/**
 * Main sanitization function
 * Returns a safe, user-friendly error message
 *
 * @param error - The error object to sanitize
 * @param isDevelopment - Whether we're in development mode (logs full error)
 * @returns A safe error message for displaying to the user
 *
 * @example
 * ```tsx
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const safeMessage = sanitizeError(error);
 *   toast.error(safeMessage);
 * }
 * ```
 */
export function sanitizeError(error: unknown, isDevelopment = false): string {
  const originalMessage = extractErrorMessage(error);
  const status = getStatusCode(error);
  const category = classifyError(error);

  // Log full error in development mode
  if (isDevelopment && typeof console !== 'undefined') {
    console.error('[Full Error Details]', {
      originalMessage,
      status,
      category,
      fullError: error,
    });
  }

  // Check if it's a safe message from our predefined maps
  let safeMessage: string | undefined;

  if (category === 'auth') {
    safeMessage = getSafeMessage(originalMessage, AUTH_SAFE_MESSAGES);
  } else if (category === 'validation') {
    safeMessage = getSafeMessage(originalMessage, VALIDATION_SAFE_MESSAGES);
  }

  // If we found a safe message, use it
  if (safeMessage) {
    return safeMessage;
  }

  // Try to use a generic message based on status code
  if (status && GENERIC_MESSAGES[String(status)]) {
    return GENERIC_MESSAGES[String(status)];
  }

  // If category is network, use network error message
  if (category === 'network') {
    return GENERIC_MESSAGES['network'];
  }

  // Otherwise, redact the original message and return it
  const redactedMessage = redactSensitivePatterns(originalMessage);

  // If redaction removed everything, use generic message
  if (redactedMessage.length === 0 || redactedMessage === originalMessage.replace(/./g, '[redacted]')) {
    return 'An error occurred. Please try again';
  }

  return redactedMessage;
}

/**
 * Sanitize multiple error messages (e.g., form validation errors)
 * @param errors - Object with field names as keys and error messages as values
 * @param isDevelopment - Whether we're in development mode
 * @returns Object with sanitized error messages
 */
export function sanitizeErrorMap(
  errors: Record<string, string | string[]>,
  isDevelopment = false
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [field, message] of Object.entries(errors)) {
    if (Array.isArray(message)) {
      sanitized[field] = sanitizeError(new Error(message[0]), isDevelopment);
    } else {
      sanitized[field] = sanitizeError(new Error(message), isDevelopment);
    }
  }

  return sanitized;
}

/**
 * Check if an error is critical (should be reported/logged)
 * @param error - The error to check
 * @returns True if the error is critical and should be reported
 */
export function isCriticalError(error: unknown): boolean {
  const status = getStatusCode(error);

  // Server errors (5xx) are critical
  if (status && status >= 500) {
    return true;
  }

  // Network errors are critical
  if (status === undefined) {
    const message = extractErrorMessage(error).toLowerCase();
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }
  }

  return false;
}

/**
 * Get error severity level
 * Useful for styling toast notifications
 * @param error - The error object
 * @returns 'error', 'warning', or 'info'
 */
export function getErrorSeverity(error: unknown): 'error' | 'warning' | 'info' {
  const status = getStatusCode(error);

  // Server errors = error
  if (status && status >= 500) {
    return 'error';
  }

  // Rate limiting = warning
  if (status === 429) {
    return 'warning';
  }

  // Authentication = error
  if (status === 401 || status === 403) {
    return 'error';
  }

  // Validation = warning
  if (status === 400 || status === 422) {
    return 'warning';
  }

  // Default = error
  return 'error';
}

export default {
  sanitizeError,
  sanitizeErrorMap,
  isCriticalError,
  getErrorSeverity,
  extractErrorMessage,
  classifyError,
};
