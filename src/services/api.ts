import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Export base URL for use in components (for static assets like logo)
// For production without backend, temporarily use a placeholder
export const API_BASE_URL_FOR_ASSETS = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Prevent browser from caching requests to ensure fresh data
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  // Ensure proper response handling
  validateStatus: (status) => status >= 200 && status < 300,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('acc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('acc_token');
      localStorage.removeItem('acc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setAuthToken: (token: string | null) => {
    if (token) {
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.Authorization;
    }
  },

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  register: (endpoint: string, data: any) =>
    apiClient.post(endpoint, data),

  verifyOTP: (email: string, otp: string, purpose?: string) =>
    apiClient.post('/auth/verify-otp', { email, otp, purpose }),

  resendOTP: (email: string, purpose?: string) =>
    apiClient.post('/auth/resend-otp', { email, purpose }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, otp: string, resetToken: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { email, otp, resetToken, newPassword }),
};

// User API
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  completeProfile: (data: any) => apiClient.post('/users/complete-profile', data),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  getCourses: () => apiClient.get('/users/courses'),
  getNavbarInfo: () => apiClient.get('/users/navbar-info'),
  getDashboardStats: () => apiClient.get('/users/dashboard-stats'),
  getRecentActivity: () => apiClient.get('/users/recent-activity'),
  getMyRatings: () => apiClient.get('/users/my-ratings'),
  uploadPhoto: (photoFile: File) => {
    const formData = new FormData();
    formData.append('profilePhoto', photoFile);
    return apiClient.post('/users/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Resume API
export const resumeAPI = {
  // Templates
  getTemplates: () => apiClient.get('/resumes/templates'),
  
  // Resume CRUD
  getResumes: (status?: 'draft' | 'completed') => 
    apiClient.get('/resumes', { params: status ? { status } : {} }),
  getResume: (id: number) => apiClient.get(`/resumes/${id}`),
  createResume: (data: any) => apiClient.post('/resumes', data),
  updateResume: (id: number, data: any) => apiClient.put(`/resumes/${id}`, data),
  deleteResume: (id: number) => apiClient.delete(`/resumes/${id}`),
  
  // Auto-save and status
  autoSaveResume: (id: number, updates: any) => apiClient.patch(`/resumes/${id}/autosave`, updates),
  setPrimaryResume: (id: number) => apiClient.patch(`/resumes/${id}/primary`),
  completeResume: (id: number) => apiClient.patch(`/resumes/${id}/complete`),
  
  // Actions
  downloadResume: (id: number) => apiClient.get(`/resumes/${id}/download`),
  duplicateResume: (id: number, title?: string) => 
    apiClient.post(`/resumes/${id}/duplicate`, { title }),
};

// Company API
export const companyAPI = {
  getProfile: () => apiClient.get('/companies/profile'),
  completeProfile: (data: any) => apiClient.post('/companies/complete-profile', data),
  updateProfile: (data: any) => apiClient.put('/companies/profile', data),
  getAll: () => apiClient.get('/companies'),
  getById: (id: number) => apiClient.get(`/companies/${id}`),
};

// Job API
export const jobAPI = {
  getAll: (params?: any) => apiClient.get('/jobs', { params }),
  getById: (id: number) => apiClient.get(`/jobs/${id}`),
  getCategories: () => apiClient.get('/jobs/categories'),
  create: (data: any) => apiClient.post('/jobs', data),
  update: (id: number, data: any) => apiClient.put(`/jobs/${id}`, data),
  delete: (id: number) => apiClient.delete(`/jobs/${id}`),
  getMyJobs: () => apiClient.get('/jobs/company/my-jobs'),
};


// Admin API
export const adminAPI = {
  getPendingApprovals: () => apiClient.get('/admin/pending-approvals'),
  approve: (type: string, id: number) => apiClient.post(`/admin/approve/${type}/${id}`),
  reject: (type: string, id: number) => apiClient.post(`/admin/reject/${type}/${id}`),
  getUsers: () => apiClient.get('/admin/users'),
  getCoordinators: () => apiClient.get('/admin/coordinators'),
  getCompanies: () => apiClient.get('/admin/companies'),
  getJobs: () => apiClient.get('/admin/jobs'),
  getProfile: () => apiClient.get('/admin/profile'),
  updateProfile: (data: any) => apiClient.put('/admin/profile', data),
};

// Named export for compatibility
export const api = apiClient;

// Job Rating APIs
export const jobRatingAPI = {
  rateJob: (jobId: number, data: { rating: number; review?: string }) => 
    apiClient.post(`/jobs/${jobId}/rate`, data),
  getJobRatings: (jobId: number) => apiClient.get(`/jobs/${jobId}/ratings`),
  getMyJobRating: (jobId: number) => apiClient.get(`/jobs/${jobId}/my-rating`),
};

// Coordinator Rating APIs
export const coordinatorRatingAPI = {
  rateCoordinator: (coordinatorId: number, data: { 
    rating: number; 
    review?: string; 
    context: 'job_post' | 'team_page';
    jobId?: number;
  }) => apiClient.post(`/coordinators/${coordinatorId}/rate`, data),
  getCoordinatorRatings: (coordinatorId: number) => 
    apiClient.get(`/coordinators/${coordinatorId}/ratings`),
  getMyCoordinatorRating: (coordinatorId: number) => 
    apiClient.get(`/coordinators/${coordinatorId}/my-rating`),
};

// Company Rating APIs
export const companyRatingAPI = {
  rateCompany: (companyId: number, data: { 
    rating: number; 
    review?: string; 
    context: 'job_post' | 'team_page';
    jobId?: number;
  }) => apiClient.post(`/companies/${companyId}/rate`, data),
  getCompanyRatings: (companyId: number) => 
    apiClient.get(`/companies/${companyId}/ratings`),
  getMyCompanyRating: (companyId: number) => 
    apiClient.get(`/companies/${companyId}/my-rating`),
};

export default apiClient;
