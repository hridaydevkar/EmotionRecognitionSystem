import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token?: string;
    user?: User;
  };
}

class AuthService {
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data.access_token) {
        const { access_token, user } = response.data.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Login failed' };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      return null;
    }
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

const authService = new AuthService();
export default authService;
