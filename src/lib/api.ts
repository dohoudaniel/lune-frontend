import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Required for the browser to send HttpOnly auth cookies cross-origin
    withCredentials: true,
});

// Response interceptor: on 401, attempt a silent cookie-based token refresh
apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // The refresh token lives in an HttpOnly cookie — just POST to the endpoint
                await axios.post(`${API_URL}/auth/refresh/`, {}, { withCredentials: true });
                // New access cookie has been set; retry the original request
                return apiInstance(originalRequest);
            } catch {
                // Refresh failed — clear stale cache and let the caller handle the 401
                localStorage.removeItem('lune_user_profile');
                window.dispatchEvent(new Event('auth:session-expired'));
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export const api = {
    get: (endpoint: string) => apiInstance.get(endpoint).then(res => res.data),
    post: (endpoint: string, data?: unknown) => apiInstance.post(endpoint, data).then(res => res.data),
    put: (endpoint: string, data?: unknown) => apiInstance.put(endpoint, data).then(res => res.data),
    delete: (endpoint: string) => apiInstance.delete(endpoint).then(res => res.data),
};
