import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { Plus, Edit, Trash2, Clock, LogIn, LogOut, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Loading } from '../components/Loading';

interface Attendance {
  _id: string;
  employee: { firstName: string; lastName: string; employeeId: string };
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  workHours?: number;
  notes?: string;
}

interface AttendanceForm {
  employee?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

const Attendance: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AttendanceForm>();

  // Đảm bảo user tồn tại trước khi render
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Lấy trạng thái hôm nay
  const { data: todayStatus, refetch: refetchToday } = useQuery({
    queryKey: ['attendanceToday'],
    queryFn: async () => {
      try {
        const response = await api.get('/attendances/today');
        return response.data;
      } catch (error: any) {
        // Nếu lỗi, trả về object mặc định
        return {
          success: true,
          data: null,
          canCheckIn: false,
          canCheckOut: false,
          message: error.response?.data?.message || 'Không thể tải trạng thái chấm công',
        };
      }
    },
    enabled: user?.role === 'employee',
    retry: false,
  });

  // Lấy danh sách chấm công
  const { data: attendancesData, isLoading } = useQuery({
    queryKey: ['attendances', selectedEmployee, dateFilter],
    queryFn: async () => {
      try {
        const params: any = {};
        if (selectedEmployee) params.employee = selectedEmployee;
        if (dateFilter) {
          params.startDate = dateFilter;
          params.endDate = dateFilter;
        }
        const response = await api.get('/attendances', { params });
        return response.data;
      } catch (error: any) {
        console.error('Error fetching attendances:', error);
        return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    },
    retry: false,
  });

  // Lấy thống kê
  const { data: stats } = useQuery({
    queryKey: ['attendanceStats', selectedEmployee],
    queryFn: async () => {
      try {
        const params: any = {};
        if (selectedEmployee) params.employee = selectedEmployee;
        const response = await api.get('/attendances/stats', { params });
        return response.data;
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        return { success: true, data: { total: 0, present: 0, late: 0, absent: 0, halfDay: 0, totalWorkHours: 0 } };
      }
    },
    retry: false,
  });

  // Lấy danh sách nhân viên (cho admin/hr)
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees?limit=1000');
      return response.data;
    },
    enabled: user?.role !== 'employee',
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendances/check-in');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      showToast(data.message || 'Check-in thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi check-in', 'error');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendances/check-out');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      showToast(data.message || 'Check-out thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi check-out', 'error');
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      if (editingAttendance) {
        const response = await api.put(`/attendances/${editingAttendance._id}`, data);
        return response.data;
      } else {
        const response = await api.post('/attendances/create', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      setShowModal(false);
      setEditingAttendance(null);
      reset();
      showToast(editingAttendance ? 'Cập nhật chấm công thành công!' : 'Tạo chấm công thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attendances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      showToast('Đã xóa chấm công thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xóa chấm công', 'error');
    },
  });

  const onSubmit = (data: AttendanceForm) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (attendance: Attendance) => {
    try {
      setEditingAttendance(attendance);
      const employeeId = typeof attendance.employee === 'string' 
        ? attendance.employee 
        : (attendance.employee as any)?._id;
      
      reset({
        employee: employeeId || '',
        date: attendance.date ? format(new Date(attendance.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        checkIn: attendance.checkIn ? format(new Date(attendance.checkIn), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        checkOut: attendance.checkOut ? format(new Date(attendance.checkOut), "yyyy-MM-dd'T'HH:mm") : undefined,
        status: attendance.status || 'present',
        notes: attendance.notes || '',
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error editing attendance:', error);
      showToast('Có lỗi xảy ra khi chỉnh sửa chấm công', 'error');
    }
  };

  const handleDelete = async (id: string, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa chấm công của "${employeeName}" không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      present: { text: 'Có mặt', class: 'bg-green-100 text-green-800' },
      late: { text: 'Muộn', class: 'bg-yellow-100 text-yellow-800' },
      absent: { text: 'Vắng mặt', class: 'bg-red-100 text-red-800' },
      'half-day': { text: 'Nửa ngày', class: 'bg-orange-100 text-orange-800' },
    };
    const badge = badges[status] || badges.present;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const attendances = attendancesData?.data || [];
  const statsData = stats?.data || { total: 0, present: 0, late: 0, absent: 0, halfDay: 0, totalWorkHours: 0 };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chấm công</h1>
          <p className="text-gray-600 mt-1">Quản lý chấm công nhân viên</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <button
            onClick={() => {
              setEditingAttendance(null);
              reset({
                date: format(new Date(), 'yyyy-MM-dd'),
                checkIn: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                status: 'present',
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Tạo chấm công
          </button>
        )}
      </div>

      {/* Check-in/Check-out cho Employee */}
      {user?.role === 'employee' && (
        <>
          {todayStatus?.message && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{todayStatus.message}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Check-in</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {todayStatus?.data?.checkIn
                      ? `Đã check-in lúc ${format(new Date(todayStatus.data.checkIn), 'HH:mm')}`
                      : todayStatus?.message || 'Chưa check-in hôm nay'}
                  </p>
                </div>
                <button
                  onClick={() => checkInMutation.mutate()}
                  disabled={!todayStatus?.canCheckIn || checkInMutation.isPending}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn size={20} />
                  {checkInMutation.isPending ? 'Đang xử lý...' : 'Check-in'}
                </button>
              </div>
            </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Check-out</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {todayStatus?.data?.checkOut
                    ? `Đã check-out lúc ${format(new Date(todayStatus.data.checkOut), 'HH:mm')}`
                    : todayStatus?.data?.checkIn
                    ? 'Chưa check-out'
                    : todayStatus?.message || 'Cần check-in trước'}
                </p>
              </div>
              <button
                onClick={() => checkOutMutation.mutate()}
                disabled={!todayStatus?.canCheckOut || checkOutMutation.isPending}
                className="btn-success flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={20} />
                {checkOutMutation.isPending ? 'Đang xử lý...' : 'Check-out'}
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Thống kê - Ẩn với employee */}
      {statsData && (user?.role !== 'employee') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số ngày</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{statsData.total || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Có mặt</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{statsData.present || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Muộn</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{statsData.late || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng giờ làm</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{statsData.totalWorkHours?.toFixed(1) || 0}h</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nhân viên</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tất cả nhân viên</option>
                  {employees.data?.map((emp: any) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Danh sách chấm công */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giờ làm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={
                    (user?.role === 'admin' || user?.role === 'hr') ? 7 : 
                    (user?.role === 'manager') ? 7 : 6
                  } className="px-6 py-4">
                    <Loading />
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={
                    (user?.role === 'admin' || user?.role === 'hr') ? 7 : 
                    (user?.role === 'manager') ? 7 : 6
                  } className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu chấm công
                  </td>
                </tr>
              ) : (
                attendances.map((attendance: Attendance) => (
                  <tr key={attendance._id} className="hover:bg-gray-50">
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {typeof attendance.employee === 'object' 
                            ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                            : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {typeof attendance.employee === 'object' ? attendance.employee.employeeId : ''}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.date ? format(new Date(attendance.date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkIn ? format(new Date(attendance.checkIn), 'HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkOut ? format(new Date(attendance.checkOut), 'HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.workHours ? `${attendance.workHours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(attendance.status)}</td>
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(attendance)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                attendance._id,
                                typeof attendance.employee === 'object'
                                  ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                                  : 'Nhân viên'
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingAttendance ? 'Sửa chấm công' : 'Tạo chấm công'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {employees && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nhân viên *</label>
                    <select
                      {...register('employee', { required: 'Vui lòng chọn nhân viên' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.data?.map((emp: any) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                    {errors.employee && (
                      <p className="text-red-500 text-sm mt-1">{errors.employee.message}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày *</label>
                  <input
                    type="date"
                    {...register('date', { required: 'Vui lòng chọn ngày' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in *</label>
                    <input
                      type="datetime-local"
                      {...register('checkIn', { required: 'Vui lòng chọn giờ check-in' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.checkIn && (
                      <p className="text-red-500 text-sm mt-1">{errors.checkIn.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                    <input
                      type="datetime-local"
                      {...register('checkOut')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái *</label>
                  <select
                    {...register('status', { required: 'Vui lòng chọn trạng thái' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="present">Có mặt</option>
                    <option value="late">Muộn</option>
                    <option value="absent">Vắng mặt</option>
                    <option value="half-day">Nửa ngày</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAttendance(null);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Đang lưu...' : editingAttendance ? 'Cập nhật' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {ConfirmDialog}
    </div>
  );
};

export default Attendance;

