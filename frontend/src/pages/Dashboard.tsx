import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Users, Building2, Calendar, DollarSign, TrendingUp, Activity, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loading, SkeletonCard } from '../components/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
  byDepartment: Array<{ name: string; count: number }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: stats } = useQuery<{ success: boolean; data: Stats }>({
    queryKey: ['employeeStats'],
    queryFn: async () => {
      const response = await api.get('/employees/stats');
      return response.data;
    },
    enabled: user?.role === 'admin' || user?.role === 'hr', // Chỉ admin và HR mới có quyền xem stats
    retry: false,
  });

  const { data: leaves } = useQuery({
    queryKey: ['pendingLeaves'],
    queryFn: async () => {
      const response = await api.get('/leaves?status=pending&limit=5');
      return response.data;
    },
    retry: false,
  });

  const statsData = stats?.data;

  // Prepare chart data
  const departmentChartData = statsData?.byDepartment?.map((dept) => ({
    name: dept.name.length > 10 ? dept.name.substring(0, 10) + '...' : dept.name,
    fullName: dept.name,
    count: dept.count,
  })) || [];

  const statusChartData = statsData
    ? [
        { name: 'Đang làm việc', value: statsData.active, color: '#10b981' },
        { name: 'Không hoạt động', value: statsData.inactive, color: '#f59e0b' },
        { name: 'Đã nghỉ việc', value: statsData.terminated, color: '#ef4444' },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý nhân sự</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity size={16} />
          <span>Real-time</span>
        </div>
      </div>

      {/* Stats Cards - Chỉ hiển thị cho admin và HR */}
      {(user?.role === 'admin' || user?.role === 'hr') && (
        <>
          {!statsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-hover group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Tổng nhân viên</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 bounce-in">{statsData?.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <TrendingUp size={12} />
                      Tất cả phòng ban
                    </p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-full group-hover:bg-primary-200 transition-colors">
                    <Users className="text-primary-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="card-hover group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Đang làm việc</p>
                    <p className="text-3xl font-bold text-green-600 mt-2 bounce-in">{statsData?.active || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Nhân viên active</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                    <Users className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="card-hover group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Nghỉ phép chờ duyệt</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2 bounce-in">
                      {leaves?.data?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cần xử lý</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200 transition-colors">
                    <Calendar className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="card-hover group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Phòng ban</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2 bounce-in">
                      {statsData?.byDepartment?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tổng số phòng ban</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Building2 className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          {statsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Department Distribution Chart */}
              {departmentChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-primary-600" />
                    Phân bố nhân viên theo phòng ban
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string, props: any) => [
                          `${value} nhân viên`,
                          props.payload.fullName,
                        ]}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Status Distribution Pie Chart */}
              {statusChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-primary-600" />
                    Trạng thái nhân viên
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dashboard cho Manager */}
      {user?.role === 'manager' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-hover group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Nghỉ phép chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2 bounce-in">
                  {leaves?.data?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Trong phòng ban của bạn</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200 transition-colors">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card-hover group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Quản lý phòng ban</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  Trưởng phòng
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Xem và duyệt đơn nghỉ phép
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full group-hover:bg-primary-200 transition-colors">
                <Users className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard cho Employee */}
      {user?.role === 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-hover group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Thông tin cá nhân</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  Nhân viên
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Xem và quản lý thông tin của bạn
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full group-hover:bg-primary-200 transition-colors">
                <Users className="text-primary-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card-hover group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Nghỉ phép</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  Quản lý nghỉ phép
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Xem và tạo đơn nghỉ phép
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200 transition-colors">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card-hover group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Bảng lương</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  Xem lương
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Xem bảng lương của bạn
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Leaves - Hiển thị cho tất cả roles */}
      {leaves?.data && leaves.data.length > 0 && (
        <div className="card slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="text-primary-600" size={20} />
              Đơn nghỉ phép chờ duyệt
            </h2>
            <span className="badge badge-warning">{leaves.data.length} đơn</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Loại</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Số ngày</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {leaves.data.map((leave: any, index: number) => (
                  <tr key={leave._id} className="slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-xs">
                            {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{leave.leaveType}</td>
                    <td>{new Date(leave.startDate).toLocaleDateString('vi-VN')}</td>
                    <td>{new Date(leave.endDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className="font-medium">{leave.days} ngày</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{leave.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
