import axios from "axios";

// In development, use a relative path so requests go through the Vite proxy
// (localhost:3000/api → proxy → localhost:8000/api). This keeps auth cookies
// same-origin and avoids SameSite=Lax blocking cross-origin cookie sends.
// In production, set VITE_API_URL to your full backend URL.
const API_URL = import.meta.env.VITE_API_URL || "/api";

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Required for the browser to send HttpOnly auth cookies cross-origin
  withCredentials: true,
});

// ── CSRF Token Handling ──────────────────────────────────────────────────
// Extract CSRF token from cookie and include in request headers for state-changing operations
// This implements the "double-submit cookie" pattern for CSRF protection

/**
 * Extract CSRF token from cookies.
 * Django CSRF middleware expects the token in the csrftoken cookie.
 */
function getCSRFToken(): string | null {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Add CSRF token to request headers for state-changing requests.
 * Django's CSRF middleware will validate this token.
 */
apiInstance.interceptors.request.use(
  async (config) => {
    // Only add CSRF token for state-changing requests
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
      config.method?.toUpperCase() || "",
    );

    if (isStateChanging) {
      let csrfToken = getCSRFToken();

      // If CSRF token is missing, attempt to fetch it via a GET request
      if (!csrfToken) {
        try {
          await axios.get(`${config.baseURL || API_URL}/users/me/`, {
            withCredentials: true,
          });
          csrfToken = getCSRFToken();
        } catch (err) {
          // Ignore error, might just be unauthenticated
        }
      }

      if (csrfToken) {
        // Django expects CSRF token in X-CSRFToken header
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ── Token refresh state ──────────────────────────────────────────────────
// Prevents multiple concurrent 401s from each firing their own refresh request.
// With ROTATE_REFRESH_TOKENS=True on the backend, only the first refresh can
// succeed — subsequent calls would use the already-rotated (now invalid) token
// and trigger a session-expired event even though the session is still valid.
let isRefreshing = false;
type QueueEntry = { resolve: () => void; reject: (err: unknown) => void };
let pendingQueue: QueueEntry[] = [];

const drainQueue = (error: unknown | null) => {
  pendingQueue.forEach((entry) =>
    error ? entry.reject(error) : entry.resolve(),
  );
  pendingQueue = [];
};
// ────────────────────────────────────────────────────────────────────────────

// Response interceptor: on 401, attempt a silent cookie-based token refresh
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that haven't been retried yet.
    // Skip the refresh endpoint itself to avoid infinite loops.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh/")
    ) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one and
        // retry it once the refresh settles.
        return new Promise<void>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(() => apiInstance(originalRequest))
          .catch(() => Promise.reject(error));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // The refresh token lives in an HttpOnly cookie — just POST.
        await apiInstance.post("/auth/refresh/", {});
        drainQueue(null); // unblock all waiting requests
        return apiInstance(originalRequest);
      } catch (refreshError) {
        drainQueue(refreshError); // reject all waiting requests
        localStorage.removeItem("lune_user_profile");
        window.dispatchEvent(new Event("auth:session-expired"));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  get: (endpoint: string) => apiInstance.get(endpoint).then((res) => res.data),
  post: (endpoint: string, data?: unknown) =>
    apiInstance.post(endpoint, data).then((res) => res.data),
  put: (endpoint: string, data?: unknown) =>
    apiInstance.put(endpoint, data).then((res) => res.data),
  patch: (endpoint: string, data?: unknown) =>
    apiInstance.patch(endpoint, data).then((res) => res.data),
  delete: (endpoint: string) =>
    apiInstance.delete(endpoint).then((res) => res.data),
  postForm: (endpoint: string, data: FormData) =>
    apiInstance.post(endpoint, data).then((res) => res.data),
};
