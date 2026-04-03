import axios from 'axios';
import { getToken } from './authStorage';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor for Auth (per-tab session via sessionStorage)
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    return apiClient.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  register: (userData) => apiClient.post('/auth/register', userData),
  getProfile: () => apiClient.get('/auth/me'),
};

export const applicantService = {
  getJobs: () => apiClient.get('/applicant/jobs'),
  apply: (jobId, formData) => {
    return apiClient.post(`/applicant/apply/${jobId}`, formData);
  },
  getStatus: () => apiClient.get('/applicant/status'),
};

export const hrService = {
  createJob: (jobData) => apiClient.post('/hr/jobs', jobData),
  getJobs: () => apiClient.get('/hr/jobs'),
  getSummary: () => apiClient.get('/hr/summary'),
  getApplicants: (jobId) => apiClient.get(`/hr/applications/${jobId}`),
  updateStatus: (appId, status) => apiClient.patch(`/hr/applications/${appId}/status`, null, { params: { status } }),
};

export const adminService = {
  getMetrics: () => apiClient.get('/admin/metrics'),
  getLogs: () => apiClient.get('/admin/logs'),
  getHrRecruiters: () => apiClient.get('/admin/hr-recruiters'),
};

export default apiClient;
