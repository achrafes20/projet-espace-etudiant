import axios from 'axios';

// Prefer relative /api (proxied by Vite in dev) for simpler CORS-free setup.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 20000,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Normalize common errors (network / timeout) for better UX at call sites.
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error?.code === 'ECONNABORTED') {
            error.userMessage = 'Le serveur met trop de temps à répondre. Réessayez.';
        } else if (!error?.response) {
            error.userMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
        } else {
            error.userMessage = error.response?.data?.message || 'Une erreur est survenue.';
        }
        return Promise.reject(error);
    }
);

export const validateStudent = (data) => api.post('/student/validate', data);
export const checkField = (data) => api.post('/student/check-field', data);
export const createRequest = (data) => api.post('/student/request', data);
export const createComplaint = (data) => api.post('/student/complaint', data);
export const checkStatus = (data) => api.post('/student/status', data);

export const adminLogin = (data) => api.post('/admin/login', data);
export const getDashboardStats = (params) => api.get('/admin/dashboard-stats', { params });
export const getRequests = (params) => api.get('/admin/requests', { params });
export const getHistory = (params) => api.get('/admin/history', { params });
export const exportHistory = (params) => api.get('/admin/history/export', { params, responseType: 'blob' });
export const getRequestById = (id) => api.get(`/admin/requests/${id}`);
export const updateRequestStatus = (id, data) => api.put(`/admin/requests/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateRequestDraft = (id, data) => api.put(`/admin/requests/${id}/draft`, data);
export const getComplaints = (params) => api.get('/admin/complaints', { params });
export const respondToComplaint = (id, data) => {
    // Si data est FormData, utiliser multipart/form-data, sinon JSON
    if (data instanceof FormData) {
        return api.put(`/admin/complaints/${id}/respond`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.put(`/admin/complaints/${id}/respond`, data);
};

export default api;
