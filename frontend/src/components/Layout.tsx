import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('Đăng xuất thành công', 'success');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'hr', 'manager', 'employee'] },
    { path: '/employees', label: 'Nhân viên', icon: '👥', roles: ['admin', 'hr', 'manager'] },
    { path: '/departments', label: 'Phòng ban', icon: '🏢', roles: ['admin', 'hr'] },
    { path: '/positions', label: 'Chức vụ', icon: '💼', roles: ['admin', 'hr'] },
    { path: '/leaves', label: 'Nghỉ phép', icon: '📅', roles: ['admin', 'hr', 'manager', 'employee'] },
    { path: '/salaries', label: 'Lương', icon: '💰', roles: ['admin', 'hr', 'employee'] },
  ].filter((item) => item.roles.includes(user?.role || ''));

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700/50">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              HRM System
            </h1>
            <p className="text-xs text-slate-400 mt-1">Human Resource Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="mb-3 p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
            <Link
              to="/profile"
              className={`w-full flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 mb-2 ${
                isActive('/profile')
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="mr-2">👤</span>
              <span className="font-medium">Hồ sơ</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-sm text-rose-300 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all duration-200 font-medium border border-rose-600/30 hover:border-rose-500"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
