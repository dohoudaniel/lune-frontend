const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });
        
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    put: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    delete: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }
};
