import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// ── DASHBOARD ────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// ── DISASTERS ────────────────────────────────────────────────
export const disastersApi = {
  getAll: (params?: any) => api.get('/disasters', { params }),
  getOne: (id: number) => api.get(`/disasters/${id}`),
  create: (data: any) => api.post('/disasters', data),
  update: (id: number, data: any) => api.put(`/disasters/${id}`, data),
  delete: (id: number) => api.delete(`/disasters/${id}`),
  getTypes: () => api.get('/disaster-types'),
  createType: (data: any) => api.post('/disaster-types', data),
};

// ── LOCATIONS ────────────────────────────────────────────────
export const locationsApi = {
  getAll: () => api.get('/locations'),
  create: (data: any) => api.post('/locations', data),
  update: (id: number, data: any) => api.put(`/locations/${id}`, data),
  delete: (id: number) => api.delete(`/locations/${id}`),
  getAffectedAreas: () => api.get('/affected-areas'),
};

// ── AFFECTED PEOPLE ──────────────────────────────────────────
export const affectedPeopleApi = {
  getAll: (params?: any) => api.get('/affected-people', { params }),
  create: (data: any) => api.post('/affected-people', data),
  update: (id: number, data: any) => api.put(`/affected-people/${id}`, data),
  delete: (id: number) => api.delete(`/affected-people/${id}`),
};

// ── RELIEF CENTERS ───────────────────────────────────────────
export const reliefCentersApi = {
  getAll: (params?: any) => api.get('/relief-centers', { params }),
  create: (data: any) => api.post('/relief-centers', data),
  update: (id: number, data: any) => api.put(`/relief-centers/${id}`, data),
  delete: (id: number) => api.delete(`/relief-centers/${id}`),
};

// ── RESOURCES ────────────────────────────────────────────────
export const resourcesApi = {
  getAll: (params?: any) => api.get('/resources', { params }),
  create: (data: any) => api.post('/resources', data),
  update: (id: number, data: any) => api.put(`/resources/${id}`, data),
  delete: (id: number) => api.delete(`/resources/${id}`),
  getCategories: () => api.get('/resource-categories'),
  createCategory: (data: any) => api.post('/resource-categories', data),
};

// ── INVENTORY ────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  create: (data: any) => api.post('/inventory', data),
  update: (id: number, data: any) => api.put(`/inventory/${id}`, data),
};

// ── RESOURCE REQUESTS ────────────────────────────────────────
export const requestsApi = {
  getAll: (params?: any) => api.get('/resource-requests', { params }),
  create: (data: any) => api.post('/resource-requests', data),
  update: (id: number, data: any) => api.put(`/resource-requests/${id}`, data),
};

// ── DISTRIBUTIONS ────────────────────────────────────────────
export const distributionsApi = {
  getAll: () => api.get('/distributions'),
  create: (data: any) => api.post('/distributions', data),
};

// ── VOLUNTEERS ───────────────────────────────────────────────
export const volunteersApi = {
  getAll: (params?: any) => api.get('/volunteers', { params }),
  update: (id: number, data: any) => api.put(`/volunteers/${id}`, data),
  getAssignments: (params?: any) => api.get('/volunteer-assignments', { params }),
  createAssignment: (data: any) => api.post('/volunteer-assignments', data),
};

// ── DONORS & DONATIONS ───────────────────────────────────────
export const donorsApi = {
  getAll: (params?: any) => api.get('/donors', { params }),
  create: (data: any) => api.post('/donors', data),
};
export const donationsApi = {
  getAll: (params?: any) => api.get('/donations', { params }),
  create: (data: any) => api.post('/donations', data),
  update: (id: number, data: any) => api.put(`/donations/${id}`, data),
};

// ── RESCUE OPERATIONS ────────────────────────────────────────
export const operationsApi = {
  getAll: (params?: any) => api.get('/rescue-operations', { params }),
  create: (data: any) => api.post('/rescue-operations', data),
  update: (id: number, data: any) => api.put(`/rescue-operations/${id}`, data),
  delete: (id: number) => api.delete(`/rescue-operations/${id}`),
};

// ── RELIEF TASKS ─────────────────────────────────────────────
export const tasksApi = {
  getAll: (params?: any) => api.get('/relief-tasks', { params }),
  create: (data: any) => api.post('/relief-tasks', data),
  update: (id: number, data: any) => api.put(`/relief-tasks/${id}`, data),
  delete: (id: number) => api.delete(`/relief-tasks/${id}`),
};

// ── TRANSPORTATION ───────────────────────────────────────────
export const transportApi = {
  getVehicles: (params?: any) => api.get('/vehicles', { params }),
  createVehicle: (data: any) => api.post('/vehicles', data),
  updateVehicle: (id: number, data: any) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: (id: number) => api.delete(`/vehicles/${id}`),
  getAssignments: () => api.get('/transport-assignments'),
  createAssignment: (data: any) => api.post('/transport-assignments', data),
};

// ── MEDICAL ──────────────────────────────────────────────────
export const medicalApi = {
  getFacilities: (params?: any) => api.get('/medical-facilities', { params }),
  createFacility: (data: any) => api.post('/medical-facilities', data),
  updateFacility: (id: number, data: any) => api.put(`/medical-facilities/${id}`, data),
  getCases: (params?: any) => api.get('/medical-cases', { params }),
  createCase: (data: any) => api.post('/medical-cases', data),
  updateCase: (id: number, data: any) => api.put(`/medical-cases/${id}`, data),
};

// ── EMERGENCY CONTACTS ───────────────────────────────────────
export const emergencyApi = {
  getAll: (params?: any) => api.get('/emergency-contacts', { params }),
  create: (data: any) => api.post('/emergency-contacts', data),
  update: (id: number, data: any) => api.put(`/emergency-contacts/${id}`, data),
  delete: (id: number) => api.delete(`/emergency-contacts/${id}`),
};

// ── NOTIFICATIONS ────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  create: (data: any) => api.post('/notifications', data),
};

// ── USERS ────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users'),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/roles'),
};

// ── REPORTS ──────────────────────────────────────────────────
export const reportsApi = {
  get: (params: any) => api.get('/reports', { params }),
};

export default api;
