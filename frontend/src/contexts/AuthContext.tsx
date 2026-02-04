import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'hr' | 'manager' | 'employee';
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role?: string): User['role'] => {
    if (role === 'superadmin') return 'superadmin';
    if (role === 'admin') return 'admin';
    if (role === 'hr') return 'hr';
    if (role === 'manager') return 'manager';
    return 'employee';
  };

  useEffect(() => {
    // Load auth data from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser({
          ...parsedUser,
          role: normalizeRole(parsedUser?.role),
        });
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    const normalizedUser = {
      ...newUser,
      role: normalizeRole(newUser?.role),
    };
    setUser(normalizedUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    setAuth,
    logout,
    isAuthenticated: !!token && !!user,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
