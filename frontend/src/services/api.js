import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to headers if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle token refreshes on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Send request to token refresh endpoint
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Failed to refresh token -> clear and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {

    const response = await api.post("/auth/login/", credentials);

    const access = response.data.data.access;
    const refresh = response.data.data.refresh;

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    return response.data.data;
},
  getMe: async () => {
    const response = await api.get("/auth/me/");
    return response.data.data;
},
  onboard: async (data) => {
    const response = await api.post('/auth/onboard/', data);
    return response.data;
  },
};

export const adminAPI = {
  invite: async (data) => {
    const response = await api.post('/admin/invite/', data);
    return response.data;
  },
  getModerators: async () => {
    const response = await api.get('/admin/list-moderators/');
    return response.data.data;
  },
  listInvites: async () => {
    const response = await api.get('/admin/list-invites/');
    return response.data;
  },
  resendInvite: async (inviteId) => {
    const response = await api.post(`/admin/resend-invite/${inviteId}/`);
    return response.data;
  },
  revokeInvite: async (inviteId) => {
    const response = await api.delete(`/admin/revoke-invite/${inviteId}/`);
    return response.data;
  },
};

export const campusAPI = {
  list: async () => {
    const response = await api.get('/campus/');
    return response.data.data;
  },
};

export const articlesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/articles/', { params });
    return {
      results: response.data.data,
      count: response.headers['x-total-count'] ? parseInt(response.headers['x-total-count']) : response.data.data?.length
    };
  },
  get: async (id) => {
    const response = await api.get(`/articles/${id}/`);
    return response.data;
  },
  create: async (formData) => {
    // Requires multipart form for image upload
    const response = await api.post('/articles/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  update: async (id, formData) => {
    // Requires multipart form for image upload compatibility
    const response = await api.put(`/articles/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/articles/${id}/`);
    return response.data;
  },
};

export default api;
