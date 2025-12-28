import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';

interface Leave {
  _id?: string;
  employee: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

interface LeaveResponse extends Leave {
  _id: string;
  employee?: { _id: string; firstName: string; lastName: string; email: string };
}

const Leaves: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveResponse | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Leave>({
    defaultValues: selectedLeave || {},
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Calculate days
  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        reset({ ...watch(), days: diffDays });
      }
    }
  }, [startDate, endDate]);

  // Fetch leaves
  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return (response.data.data || []) as LeaveResponse[];
    },
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const response = await api.get('/employees');
        return response.data.data || [];
      } catch {
        return [];
      }
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Leave) => {
      if (selectedLeave?._id) {
        return api.put(`/leaves/${selectedLeave._id}`, data);
      } else {
        return api.post('/leaves', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showToast(selectedLeave ? 'Cập nhật đơn nghỉ phép thành công' : 'Tạo đơn nghỉ phép thành công', 'success');
      setIsModalOpen(false);
      reset();
      setSelectedLeave(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Thao tác thất bại', 'error');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.put(`/leaves/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showToast('Duyệt đơn nghỉ phép thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Duyệt đơn thất bại', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showToast('Xóa đơn nghỉ phép thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa đơn thất bại', 'error');
    },
  });

  const onSubmit = (data: Leave) => {
    saveMutation.mutate(data);
  };

  const handleApprove = async (leave: LeaveResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận duyệt',
      message: 'Bạn có chắc muốn duyệt đơn nghỉ phép này?',
      confirmText: 'Duyệt',
      cancelText: 'Hủy',
      type: 'info',
    });
    if (confirmed) {
      approveMutation.mutate(leave._id);
    }
  };

  const handleEdit = (leave: LeaveResponse) => {
    setSelectedLeave(leave);
    reset({
      employee: leave.employee?._id || (leave.employee as any) || '',
      leaveType: leave.leaveType,
      startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
      endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      comments: leave.comments || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (leave: LeaveResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa đơn nghỉ phép này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(leave._id);
    }
  };

  const handleAdd = () => {
    setSelectedLeave(null);
    reset({
      employee: user?.employeeId || '',
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      days: 1,
      reason: '',
      status: 'pending',
      comments: '',
    });
    setIsModalOpen(true);
  };

  const getLeaveTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      annual: 'Nghỉ phép năm',
      sick: 'Nghỉ ốm',
      personal: 'Nghỉ cá nhân',
      maternity: 'Nghỉ thai sản',
      paternity: 'Nghỉ thai sản (bố)',
      unpaid: 'Nghỉ không lương',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const canApprove = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div>
      {ConfirmDialog}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Nghỉ phép</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + Tạo Đơn Nghỉ phép
        </button>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại nghỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lý do
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!leaves || leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Chưa có đơn nghỉ phép nào
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.employee
                        ? `${leave.employee.firstName} ${leave.employee.lastName}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getLeaveTypeLabel(leave.leaveType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.startDate ? format(new Date(leave.startDate), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.endDate ? format(new Date(leave.endDate), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.days} ngày
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {leave.status === 'pending' && canApprove && (
                        <button
                          onClick={() => handleApprove(leave)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(leave)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Sửa
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(leave)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedLeave ? 'Sửa Đơn Nghỉ phép' : 'Tạo Đơn Nghỉ phép'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên *
                </label>
                <select
                  {...register('employee', { required: 'Nhân viên là bắt buộc' })}
                  className="input"
                  disabled={!!selectedLeave}
                >
                  <option value="">Chọn nhân viên</option>
                  {employees?.map((emp: any) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className="text-red-600 text-xs mt-1">{errors.employee.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại nghỉ phép *
                </label>
                <select {...register('leaveType', { required: 'Loại nghỉ phép là bắt buộc' })} className="input">
                  <option value="annual">Nghỉ phép năm</option>
                  <option value="sick">Nghỉ ốm</option>
                  <option value="personal">Nghỉ cá nhân</option>
                  <option value="maternity">Nghỉ thai sản</option>
                  <option value="paternity">Nghỉ thai sản (bố)</option>
                  <option value="unpaid">Nghỉ không lương</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    {...register('startDate', { required: 'Ngày bắt đầu là bắt buộc' })}
                    className="input"
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-xs mt-1">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    {...register('endDate', { required: 'Ngày kết thúc là bắt buộc' })}
                    className="input"
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-xs mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số ngày
                </label>
                <input
                  type="number"
                  {...register('days', { required: 'Số ngày là bắt buộc', min: 1 })}
                  className="input"
                  min="1"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do *
                </label>
                <textarea
                  {...register('reason', { required: 'Lý do là bắt buộc' })}
                  className="input"
                  rows={3}
                  placeholder="Nhập lý do nghỉ phép..."
                />
                {errors.reason && (
                  <p className="text-red-600 text-xs mt-1">{errors.reason.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  {...register('comments')}
                  className="input"
                  rows={2}
                  placeholder="Ghi chú (nếu có)..."
                />
              </div>

              {selectedLeave && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select {...register('status')} className="input">
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedLeave(null);
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn btn-primary"
                >
                  {saveMutation.isPending ? 'Đang lưu...' : selectedLeave ? 'Cập nhật' : 'Tạo đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
