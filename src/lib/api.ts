import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the access token
apiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('lune_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('lune_refresh_token');
                if (!refreshToken) throw new Error('No refresh token available');

                const response = await axios.post(`${API_URL}/auth/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('lune_access_token', access);
                
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // Refresh token expired or invalid - logout user
                localStorage.removeItem('lune_access_token');
                localStorage.removeItem('lune_refresh_token');
                localStorage.removeItem('lune_user_profile');
                window.location.href = '/'; // Force reload/redirect to login
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const api = {
    get: (endpoint: string) => apiInstance.get(endpoint).then(res => res.data),
    post: (endpoint: string, data?: any) => apiInstance.post(endpoint, data).then(res => res.data),
    put: (endpoint: string, data?: any) => apiInstance.put(endpoint, data).then(res => res.data),
    delete: (endpoint: string) => apiInstance.delete(endpoint).then(res => res.data),
};
