import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
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

// Écoute les 401 pour forcer la reconnexion admin
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin/login';
            }
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
