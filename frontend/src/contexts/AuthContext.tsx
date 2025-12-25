import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getAuth, setAuth as setAuthStorage, clearAuth as clearAuthStorage } from '../utils/auth';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user từ localStorage ngay lập tức
    const { token, user: savedUser } = getAuth();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    
    setIsLoading(false);
    
    // Verify token với backend trong background (optional, không block UI)
    if (token && savedUser) {
      api.get('/auth/me')
        .then((response) => {
          if (response.data.success && response.data.user) {
            // Cập nhật user từ backend (có thể có employeeId mới)
            const updatedUser = response.data.user;
            setAuthStorage(token, updatedUser);
            setUser(updatedUser);
          }
        })
        .catch((error) => {
          // Nếu token không hợp lệ, interceptor sẽ xử lý logout
          // Không cần làm gì ở đây
          console.error('Token verification failed:', error);
        });
    }
  }, []);

  const setAuth = (token: string, userData: User) => {
    setAuthStorage(token, userData);
    setUser(userData);
  };

  const clearAuth = () => {
    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setAuth,
        clearAuth,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


