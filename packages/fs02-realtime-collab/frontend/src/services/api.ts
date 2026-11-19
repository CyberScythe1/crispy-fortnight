import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

        const response = await api.post('/auth/refresh', { refreshToken });
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

export const authApi = { register: (data) => api.post('/auth/register', data), login: (data) => api.post('/auth/login', data), refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }), me: () => api.get('/auth/me'), logout: () => api.post('/auth/logout') };

export const workspaceApi = { list: (params) => api.get('/workspaces', { params }), get: (id) => api.get(`/workspaces/${id}`), create: (data) => api.post('/workspaces', data), update: (id, data) => api.patch(`/workspaces/${id}`, data), delete: (id) => api.delete(`/workspaces/${id}`), getMembers: (id) => api.get(`/workspaces/${id}/members`), addMember: (id, data) => api.post(`/workspaces/${id}/members`, data), updateMember: (id, memberId, data) => api.patch(`/workspaces/${id}/members/${memberId}`, data), removeMember: (id, memberId) => api.delete(`/workspaces/${id}/members/${memberId}`) };

export const documentApi = {
  list: (params) => api.get('/documents', { params }),
  listByWorkspace: (workspaceId, params) => api.get(`/${workspaceId}/documents`, { params }),
  get: (workspaceId, id) => api.get(`/${workspaceId}/documents/${id}`),
  create: (workspaceId, data) => api.post(`/${workspaceId}/documents`, data),
  update: (workspaceId, id, data) => api.patch(`/${workspaceId}/documents/${id}`, data),
  delete: (workspaceId, id) => api.delete(`/${workspaceId}/documents/${id}`),
  getPages: (workspaceId, id) => api.get(`/${workspaceId}/documents/${id}/pages`),
  createPage: (workspaceId, id, data) => api.post(`/${workspaceId}/documents/${id}/pages`, data),
};

export const pageApi = { get: (id) => api.get(`/pages/${id}`), create: (data) => api.post('/pages', data), update: (id, data) => api.patch(`/pages/${id}`, data), delete: (id) => api.delete(`/pages/${id}`) };

export const commentApi = { list: (params) => api.get('/comments', { params }), create: (data) => api.post('/comments', data), update: (id, data) => api.patch(`/comments/${id}`, data), delete: (id) => api.delete(`/comments/${id}`) };