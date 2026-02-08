import axios from 'axios';
import { Lead, Folder } from '@/types/lead';

const API_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const auth = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (email: string, password: string, name: string) => {
        const response = await api.post('/auth/register', { email, password, name });
        return response.data;
    },
};

export const companies = {
    getAll: async () => {
        const response = await api.get<Lead[]>('/companies');
        return response.data;
    },
    create: async (data: Partial<Lead>) => {
        const response = await api.post<Lead>('/companies', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Lead>) => {
        const response = await api.put<Lead>(`/companies/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/companies/${id}`);
    },
    search: async (query: string, options?: { type?: string, limit?: number, minRating?: number, maxRating?: number, minReviews?: number, openNow?: boolean, radius?: number, location?: string }) => {
        const response = await api.get(`/companies/search`, { params: { query, ...options } });
        return response.data;
    },
    import: async (placeId: string, folderId?: string, customData?: any) => {
        const response = await api.post<Lead>('/companies/import', { placeId, folderId, customData });
        return response.data;
    }
};

export const folders = {
    getAll: async () => {
        const response = await api.get<Folder[]>('/folders');
        return response.data;
    },
    create: async (name: string, color: string) => {
        const response = await api.post<Folder>('/folders', { name, color });
        return response.data;
    },
    update: async (id: string, data: Partial<Folder>) => {
        const response = await api.put<Folder>(`/folders/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/folders/${id}`);
    }
};

export default api;
