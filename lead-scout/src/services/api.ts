import axios from 'axios';
import { Lead, Folder } from '@/types/lead';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
            console.error('API Error:', error.response.status, error.config.url, error.response.data);
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
    updateProfile: async (data: any) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/auth/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const companies = {
    getAll: async (options?: { status?: string }) => {
        const params = options ? { status: options.status } : {};
        const response = await api.get<Lead[]>('/companies', { params });
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
    },
    bulkAssign: async (companyIds: string[], userId: string) => {
        const response = await api.post('/companies/bulk-assign', { companyIds, userId });
        return response.data;
    },
    bulkMove: async (companyIds: string[], stageId: string) => {
        const response = await api.post('/companies/bulk-move', { companyIds, stageId });
        return response.data;
    },
    bulkDelete: async (companyIds: string[]) => {
        const response = await api.post('/companies/bulk-delete', { companyIds });
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

export const users = {
    getAll: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/auth/users/${id}`, data);
        return response.data;
    }
};


export const stages = {
    getAll: async () => {
        const response = await api.get<any[]>('/stages');
        return response.data;
    },
    saveAll: async (stagesData: any[]) => {
        const response = await api.post<any[]>('/stages', stagesData);
        return response.data;
    }
};

export const whatsapp = {
    getStatus: async (type: 'global' | 'personal' = 'global') => {
        const response = await api.get(`/whatsapp/status?type=${type}`);
        return response.data;
    },
    connect: async (type: 'global' | 'personal' = 'global') => {
        const response = await api.post(`/whatsapp/connect`, { type });
        return response.data;
    },
    disconnect: async (type: 'global' | 'personal' = 'global') => {
        const response = await api.post(`/whatsapp/disconnect`, { type });
        return response.data;
    },
    getMessages: async (chatId: string) => {
        const response = await api.get(`/messages/${encodeURIComponent(chatId)}`);
        return response.data;
    },
    sendMessage: async (to: string, message: string) => {
        const response = await api.post(`/whatsapp/send`, { to, message });
        return response.data;
    },
    sendMedia: async (to: string, media: string, type: 'ptt' | 'image') => {
        const response = await api.post(`/whatsapp/send-media`, { to, media, type });
        return response.data;
    }
};

export default api;
