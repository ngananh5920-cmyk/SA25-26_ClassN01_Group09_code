import React, { useState } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Đăng xuất thành công', 'success');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Bảng điều khiển', icon: '📊', roles: ['superadmin', 'admin', 'hr', 'manager', 'employee'] },
    { path: '/employees', label: 'Nhân viên', icon: '👥', roles: ['superadmin', 'admin', 'hr'] },
    { path: '/departments', label: 'Phòng ban', icon: '🏢', roles: ['superadmin', 'admin', 'hr'] },
    { path: '/positions', label: 'Chức vụ', icon: '💼', roles: ['superadmin', 'admin', 'hr'] },
    { path: '/leaves', label: 'Nghỉ phép', icon: '📅', roles: ['superadmin', 'admin', 'hr', 'manager', 'employee'] },
    { path: '/salaries', label: 'Lương', icon: '💰', roles: ['superadmin', 'admin', 'hr', 'employee'] },
    { path: '/recruitment', label: 'Tuyển dụng', icon: '🎯', roles: ['superadmin', 'admin', 'hr'] },
    { path: '/kpis', label: 'Đánh giá & KPI', icon: '📊', roles: ['superadmin', 'admin', 'hr', 'manager', 'employee'] },
    { path: '/attendance', label: 'Chấm công', icon: '🗓️', roles: ['superadmin', 'admin', 'hr', 'manager', 'employee'] },
    { path: '/announcements', label: 'Thông báo', icon: '📢', roles: ['superadmin', 'admin', 'hr', 'manager', 'employee'] },
    { path: '/audit-logs', label: 'Audit Log', icon: '🧾', roles: ['superadmin', 'admin'] },
  ].filter((item) => item.roles.includes(user?.role || ''));

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl z-50 transition-all duration-200`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-6 border-b border-slate-700/50 ${isCollapsed ? 'px-4' : ''}`}>
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-300 to-slate-100 bg-clip-text text-transparent">
                    Hệ thống HRM
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Quản lý nhân sự</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
              >
                {isCollapsed ? '➡' : '⬅'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hidden ${isCollapsed ? 'px-3' : ''}`}>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-900/40'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className={`${isCollapsed ? '' : 'mr-3'} text-lg`}>{item.icon}</span>
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className={`p-4 border-t border-slate-700/50 ${isCollapsed ? 'px-3' : ''}`}>
            {!isCollapsed && (
              <div className="mb-3 p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
              </div>
            )}
            <Link
              to="/profile"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2.5 text-sm rounded-xl transition-all duration-200 mb-2 ${
                isActive('/profile')
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-900/40'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className={`${isCollapsed ? '' : 'mr-2'}`}>👤</span>
              {!isCollapsed && <span className="font-medium">Hồ sơ</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full ${isCollapsed ? 'px-0' : 'px-4'} py-2.5 text-sm text-rose-300 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all duration-200 font-medium border border-rose-600/30 hover:border-rose-500`}
              title={isCollapsed ? 'Đăng xuất' : undefined}
            >
              {isCollapsed ? '⏻' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
