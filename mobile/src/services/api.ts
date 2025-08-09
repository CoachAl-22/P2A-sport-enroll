import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const sessionToken = await SecureStore.getItemAsync('sessionToken');
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
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
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('sessionToken');
    }
    return Promise.reject(error);
  }
);

// API service functions
export const classesApi = {
  getClasses: () => apiClient.get('/api/classes'),
  getClass: (id: string) => apiClient.get(`/api/classes/${id}`),
};

export const enrollmentsApi = {
  getEnrollments: () => apiClient.get('/api/enrollments'),
  createEnrollment: (data: any) => apiClient.post('/api/enrollments', data),
  updateEnrollment: (id: string, data: any) => apiClient.patch(`/api/enrollments/${id}`, data),
};

export const venuesApi = {
  getVenues: () => apiClient.get('/api/venues'),
};

export const notificationsApi = {
  getNotifications: () => apiClient.get('/api/notifications'),
  markAsRead: (id: string) => apiClient.patch(`/api/notifications/${id}/read`),
};