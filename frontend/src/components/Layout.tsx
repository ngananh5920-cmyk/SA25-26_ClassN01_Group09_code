import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import SearchBar from './SearchBar';
import NotificationPanel from './NotificationPanel';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notificationsData?.unreadCount || 0;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'hr', 'manager', 'employee'] },
    { path: '/employees', icon: Users, label: 'Nhân viên', roles: ['admin', 'hr', 'manager'] },
    { path: '/departments', icon: Building2, label: 'Phòng ban', roles: ['admin', 'hr'] },
    { path: '/positions', icon: Briefcase, label: 'Chức vụ', roles: ['admin', 'hr'] },
    { path: '/leaves', icon: Calendar, label: 'Nghỉ phép', roles: ['admin', 'hr', 'manager', 'employee'] },
    { path: '/salaries', icon: DollarSign, label: 'Lương', roles: ['admin', 'hr', 'employee'] },
    { path: '/attendance', icon: Clock, label: 'Chấm công', roles: ['admin', 'hr', 'manager', 'employee'] },
  ].filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <h1 className="text-xl font-bold">HRM System</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 transition-all duration-200 transform hover:translate-x-1 relative ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"></div>
                )}
                <Icon size={20} className="mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="mb-3 px-4 text-sm text-gray-400">
            <p className="font-medium text-white">{user?.email}</p>
            <p className="text-xs capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded"
          >
            <LogOut size={18} className="mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 max-w-2xl">
              <SearchBar />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <div className="text-sm text-gray-600 hidden md:block">
                Xin chào, <span className="font-medium">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
};

export default Layout;

