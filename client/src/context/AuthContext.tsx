import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';
import { ROLES, ROLE_TRACK, STAFF_ROLES, type Track } from '../lib/roles';

interface User {
  id: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role: string;
  emailVerified?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** fotografci veya videocu — admin panelinde sadece çekim listesini görür */
  isStaff: boolean;
  /** Personelin sabit çekim izi; admin ve müşteride null */
  track: Track | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // identifier: müşteri için e-posta, admin için kullanıcı adı
  const login = async (identifier: string, password: string) => {
    try {
      const { data } = await api.post('/api/auth/login', { identifier, password });

      if (data.success) {
        setUser(data.user);
        // user'ı da döndür: login sayfası role göre yönlendirme yapıyor
        return { success: true, user: data.user as User };
      } else {
        return { success: false, message: data.message || 'Giriş başarısız' };
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'Sunucu hatası' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const { data } = await api.post('/api/auth/register', registerData);

      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Kayıt başarısız' };
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'Sunucu hatası' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === ROLES.ADMIN,
        isStaff: !!user && STAFF_ROLES.includes(user.role),
        track: (user && ROLE_TRACK[user.role]) || null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
