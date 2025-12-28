import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, Calendar, Cake, FileText } from 'lucide-react';
import api from '../utils/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/stats');
        return response.data.data;
      } catch (error) {
        // Fallback to old method if new endpoint fails
        const [employees, departments, leaves, salaries] = await Promise.all([
          api.get('/employees').catch(() => ({ data: { data: [] } })),
          api.get('/departments').catch(() => ({ data: { data: [] } })),
          api.get('/leaves').catch(() => ({ data: { data: [] } })),
          api.get('/salaries').catch(() => ({ data: { data: [] } })),
        ]);

      const employeesData = employees.data?.data || [];
      const departmentsData = departments.data?.data || [];
      const leavesData = leaves.data?.data || [];
      const salariesData = salaries.data?.data || [];

      // Calculate department distribution
      const departmentCount: Record<string, number> = {};
      employeesData.forEach((emp: any) => {
        const deptName = emp.department?.name || 'Chưa phân phòng';
        departmentCount[deptName] = (departmentCount[deptName] || 0) + 1;
      });

      const departmentChart = Object.entries(departmentCount).map(([name, count]) => ({
        name,
        value: count,
      }));

      // Calculate leave status distribution
      const leaveStatusCount = {
        pending: leavesData.filter((l: any) => l.status === 'pending').length,
        approved: leavesData.filter((l: any) => l.status === 'approved').length,
        rejected: leavesData.filter((l: any) => l.status === 'rejected').length,
      };

      return {
        totalEmployees: employeesData.length,
        activeEmployees: employeesData.filter((e: any) => e.status === 'active').length,
        inactiveEmployees: employeesData.filter((e: any) => e.status === 'inactive').length,
        terminatedEmployees: employeesData.filter((e: any) => e.status === 'terminated').length,
        totalDepartments: departmentsData.length,
        pendingLeaves: leaveStatusCount.pending,
        approvedLeaves: leaveStatusCount.approved,
        rejectedLeaves: leaveStatusCount.rejected,
        totalLeaves: leavesData.length,
        totalSalaries: salariesData.length,
        departmentChart,
        leaveStatusData: [
          { name: 'Chờ duyệt', value: leaveStatusCount.pending },
          { name: 'Đã duyệt', value: leaveStatusCount.approved },
          { name: 'Từ chối', value: leaveStatusCount.rejected },
        ],
      };
      }
    },
  });

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

  const statsCards = [
    {
      title: 'Tổng Nhân viên',
      value: stats?.totalEmployees || 0,
      icon: '👥',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Nhân viên Hoạt động',
      value: stats?.activeEmployees || 0,
      icon: '✅',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-500',
    },
    {
      title: 'Phòng ban',
      value: stats?.totalDepartments || 0,
      icon: '🏢',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Đơn Nghỉ phép Chờ duyệt',
      value: stats?.pendingLeaves || 0,
      icon: '📅',
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500',
    },
  ];

  const employeeStatusData = stats
    ? [
        { name: 'Hoạt động', value: stats.activeEmployees },
        { name: 'Không hoạt động', value: stats.inactiveEmployees },
        { name: 'Đã nghỉ việc', value: stats.terminatedEmployees },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 text-lg">
          Chào mừng, <span className="font-semibold text-slate-900">{user?.email}</span>! Vai trò:{' '}
          <span className="capitalize font-semibold text-primary-600">{user?.role}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 animate-slideUp hover:-translate-y-1`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-slate-600 text-sm font-medium mb-2">{card.title}</p>
                    <p className="text-4xl font-bold text-slate-900 mb-1">{card.value}</p>
                    {card.change && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        {card.change} so với tháng trước
                      </p>
                    )}
                  </div>
                  <div className={`${card.iconBg} text-white p-4 rounded-2xl shadow-lg text-3xl transform rotate-6 hover:rotate-12 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Employee Status Chart */}
            {employeeStatusData.length > 0 && (
              <div className="card-premium">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
                  Trạng thái Nhân viên
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={employeeStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {employeeStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Leave Status Chart */}
            {stats?.leaveStatusData && stats.leaveStatusData.length > 0 && stats.leaveStatusData.some((item: any) => item.value > 0) && (
              <div className="card-premium">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
                  Trạng thái Đơn Nghỉ phép
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.leaveStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Department Distribution */}
          {stats?.departmentChart && stats.departmentChart.length > 0 && stats.departmentChart.some((item: any) => item.value > 0) && (
            <div className="card-premium mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
                Phân bố Nhân viên theo Phòng ban
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.departmentChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-premium">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-2"></span>
                Tổng quan Hệ thống
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Tổng số Nhân viên</span>
                  <span className="font-bold text-slate-900 text-lg">{stats?.totalEmployees || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Phòng ban</span>
                  <span className="font-bold text-slate-900 text-lg">{stats?.totalDepartments || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Đơn Nghỉ phép</span>
                  <span className="font-bold text-slate-900 text-lg">{stats?.totalLeaves || 0}</span>
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full mr-2"></span>
                Đơn Nghỉ phép
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Chờ duyệt</span>
                  <span className="font-bold text-amber-600 text-lg">{stats?.pendingLeaves || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Đã duyệt</span>
                  <span className="font-bold text-emerald-600 text-lg">{stats?.approvedLeaves || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Từ chối</span>
                  <span className="font-bold text-rose-600 text-lg">{stats?.rejectedLeaves || 0}</span>
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-2"></span>
                Nhân viên
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Hoạt động</span>
                  <span className="font-bold text-emerald-600 text-lg">{stats?.activeEmployees || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Không hoạt động</span>
                  <span className="font-bold text-slate-600 text-lg">{stats?.inactiveEmployees || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Đã nghỉ việc</span>
                  <span className="font-bold text-rose-600 text-lg">{stats?.terminatedEmployees || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          {(stats?.expiringContracts?.length > 0 || stats?.upcomingBirthdays?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Expiring Contracts */}
              {stats?.expiringContracts && stats.expiringContracts.length > 0 && (
                <div className="card-premium border-l-4 border-l-amber-500">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <AlertTriangle className="text-amber-500 mr-2" size={20} />
                    Hợp đồng sắp hết hạn
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.expiringContracts.map((contract: any) => (
                      <div
                        key={contract._id}
                        className="p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {contract.employee?.firstName} {contract.employee?.lastName}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {contract.department?.name || 'Chưa có phòng ban'}
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Hết hạn: {format(new Date(contract.endDate), 'dd/MM/yyyy')} ({contract.daysRemaining} ngày)
                            </p>
                          </div>
                          <FileText className="text-amber-600" size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Birthdays */}
              {stats?.upcomingBirthdays && stats.upcomingBirthdays.length > 0 && (
                <div className="card-premium border-l-4 border-l-pink-500">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <Cake className="text-pink-500 mr-2" size={20} />
                    Sinh nhật sắp tới 🎂
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.upcomingBirthdays.map((birthday: any) => (
                      <div
                        key={birthday._id}
                        className="p-3 bg-pink-50 rounded-lg border border-pink-200 hover:bg-pink-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {birthday.firstName} {birthday.lastName}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {birthday.department?.name || 'Chưa có phòng ban'}
                            </p>
                            <p className="text-xs text-pink-700 mt-1">
                              {format(new Date(birthday.birthday), 'dd/MM/yyyy', { locale: vi })} ({birthday.daysUntil === 0 ? 'Hôm nay' : `${birthday.daysUntil} ngày nữa`})
                            </p>
                          </div>
                          <Cake className="text-pink-600" size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
