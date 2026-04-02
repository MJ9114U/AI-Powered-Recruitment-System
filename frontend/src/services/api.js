import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor for Auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
};

export const applicantService = {
  apply: (jobId, formData) => {
    return apiClient.post(`/applicant/apply/${jobId}`, formData);
  },
  getStatus: () => apiClient.get('/applicant/status'),
};

export const hrService = {
  createJob: (jobData) => apiClient.post('/hr/jobs', jobData),
  getJobs: () => apiClient.get('/hr/jobs'),
  getApplicants: (jobId) => apiClient.get(`/hr/applications/${jobId}`),
  updateStatus: (appId, status) => apiClient.patch(`/hr/applications/${appId}/status`, null, { params: { status } }),
};

export const adminService = {
  getMetrics: () => apiClient.get('/admin/metrics'),
  getLogs: () => apiClient.get('/admin/logs'),
};

export default apiClient;
