import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { email: string; password: string; company?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const entitiesApi = {
  list: () => api.get('/entities'),
  create: (data: { name: string; domain?: string }) =>
    api.post('/entities', data),
  get: (id: string) => api.get(`/entities/${id}`),
  delete: (id: string) => api.delete(`/entities/${id}`),
  addCompetitor: (entityId: string, data: { name: string; domain?: string }) =>
    api.post(`/entities/${entityId}/competitors`, data),
  removeCompetitor: (entityId: string, competitorId: string) =>
    api.delete(`/entities/${entityId}/competitors/${competitorId}`),
  toggleMute: (entityId: string, competitorId: string) =>
    api.patch(`/entities/${entityId}/competitors/${competitorId}/mute`),
};

export const sourcesApi = {
  list: (entityId: string) => api.get(`/sources?entityId=${entityId}`),
  suggest: (data: { entityId: string; url: string; type?: string }) =>
    api.post('/sources/suggest', data),
  discover: (entityId: string) =>
    api.post(`/sources/discover?entityId=${entityId}`),
};

export const signalsApi = {
  list: (params?: { entityId?: string; type?: string; limit?: number; offset?: number }) =>
    api.get('/signals', { params }),
  extract: (entityId?: string) =>
    api.post('/signals/extract', null, { params: { entityId } }),
};

export const feedApi = {
  get: (params?: { type?: string; days?: number; limit?: number; offset?: number }) =>
    api.get('/feed', { params }),
  dailyBrief: () => api.get('/feed/daily-brief'),
};

export const feedbackApi = {
  submit: (data: { signalId: string; relevant: boolean; comment?: string }) =>
    api.post('/feedback', data),
};

export default api;
