import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

// Use relative URL in Docker to leverage Vite proxy
const isAbsoluteUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
const baseURL = isAbsoluteUrl(API_URL) ? API_URL : '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const tenantApi = {
  list: (params) => api.get('/tenants', { params }),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.patch(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
};

export const projectApi = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMember: (id, memberId, data) => api.patch(`/projects/${id}/members/${memberId}`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};

export const issueApi = {
  list: (params) => api.get('/issues', { params }),
  get: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.patch(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
  getComments: (id) => api.get(`/issues/${id}/comments`),
  addComment: (id, data) => api.post(`/issues/${id}/comments`, data),
  addWatcher: (id, userId) => api.post(`/issues/${id}/watchers`, { userId }),
  removeWatcher: (id, userId) => api.delete(`/issues/${id}/watchers/${userId}`),
  getAttachments: (id) => api.get(`/issues/${id}/attachments`),
  uploadAttachment: (id, formData) => api.post(`/issues/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAttachment: (id, attachmentId) => api.delete(`/issues/${id}/attachments/${attachmentId}`),
};

export const sprintApi = {
  list: (params) => api.get('/sprints', { params }),
  get: (id) => api.get(`/sprints/${id}`),
  create: (data) => api.post('/sprints', data),
  update: (id, data) => api.patch(`/sprints/${id}`, data),
  delete: (id) => api.delete(`/sprints/${id}`),
  start: (id) => api.post(`/sprints/${id}/start`),
  complete: (id) => api.post(`/sprints/${id}/complete`),
  getIssues: (id) => api.get(`/sprints/${id}/issues`),
};

export const boardApi = {
  list: (params) => api.get('/boards', { params }),
  get: (id) => api.get(`/boards/${id}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.patch(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  getColumns: (id) => api.get(`/boards/${id}/columns`),
  createColumn: (id, data) => api.post(`/boards/${id}/columns`, data),
  updateColumn: (id, columnId, data) => api.patch(`/boards/${id}/columns/${columnId}`, data),
  deleteColumn: (id, columnId) => api.delete(`/boards/${id}/columns/${columnId}`),
  reorderColumns: (id, data) => api.post(`/boards/${id}/columns/reorder`, data),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  updateAvatar: (formData) => api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const webhookApi = {
  list: (params) => api.get('/webhooks', { params }),
  get: (id) => api.get(`/webhooks/${id}`),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.patch(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
};

export const billingApi = {
  getSubscription: () => api.get('/billing/subscription'),
  createSubscription: (data) => api.post('/billing/subscription', data),
  cancelSubscription: () => api.post('/billing/subscription/cancel'),
  updatePaymentMethod: (data) => api.post('/billing/payment-method', data),
  getInvoices: (params) => api.get('/billing/invoices', { params }),
  getBillingEvents: (params) => api.get('/billing/events', { params }),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};