import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://868ede8d-c814-4847-9bfc-097bdd55a79a-00-1r2al5zaw3y2f.janeway.replit.dev';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  sessionToken?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('sessionToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return response;
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store session token securely
    if (data.sessionToken) {
      await SecureStore.setItemAsync('sessionToken', data.sessionToken);
    }

    return data;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    await SecureStore.deleteItemAsync('sessionToken');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request('/api/auth/me');
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }

    const data = await response.json();
    return data.user;
  }

  async getClasses(filters?: any): Promise<any[]> {
    const params = new URLSearchParams(filters).toString();
    const response = await this.request(`/api/classes${params ? `?${params}` : ''}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }

    return response.json();
  }

  async getClassDetails(classId: string): Promise<any> {
    const response = await this.request(`/api/classes/${classId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch class details');
    }

    return response.json();
  }

  async enrollInClass(enrollmentData: any): Promise<any> {
    const response = await this.request('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Enrollment failed');
    }

    return response.json();
  }

  async getUserEnrollments(): Promise<any[]> {
    const response = await this.request('/api/enrollments/user');
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }

    return response.json();
  }

  async getVenues(): Promise<any[]> {
    const response = await this.request('/api/venues');
    
    if (!response.ok) {
      throw new Error('Failed to fetch venues');
    }

    return response.json();
  }
}

export const apiService = new ApiService();