import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'hr' | 'manager' | 'employee')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Đợi load user từ localStorage trước khi check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect đến route đầu tiên mà user có quyền truy cập
    const defaultRoutes: Record<string, string> = {
      employee: '/leaves', // Employee redirect đến trang nghỉ phép
      manager: '/', // Manager có thể vào dashboard
      hr: '/',
      admin: '/',
    };
    const defaultRoute = defaultRoutes[user.role] || '/leaves';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

