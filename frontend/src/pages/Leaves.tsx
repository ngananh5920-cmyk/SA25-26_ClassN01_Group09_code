import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import CommentModal from '../components/CommentModal';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Leave {
  _id: string;
  employee: { firstName: string; lastName: string; employeeId: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  approvedBy?: { firstName: string; lastName: string };
  comments?: string;
}

interface LeaveForm {
  employee?: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
}

const Leaves: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingReject, setPendingReject] = useState<{ id: string; employeeName: string } | null>(null);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LeaveForm>();

  const { data: leavesData } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return response.data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees?limit=1000');
      return response.data;
    },
    enabled: user?.role !== 'employee',
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeaveForm) => {
      const response = await api.post('/leaves', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowModal(false);
      reset();
      showToast('Đã tạo đơn nghỉ phép thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn nghỉ phép', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaveForm> }) => {
      const response = await api.put(`/leaves/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowModal(false);
      setEditingLeave(null);
      reset();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: string; comments?: string }) => {
      const response = await api.put(`/leaves/${id}/approve`, { status, comments });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showToast(`Đã ${variables.status === 'approved' ? 'duyệt' : 'từ chối'} đơn nghỉ phép!`, 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt đơn nghỉ phép', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showToast('Đã xóa đơn nghỉ phép thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn nghỉ phép', 'error');
    },
  });

  const onSubmit = (data: LeaveForm) => {
    if (editingLeave) {
      updateMutation.mutate({ id: editingLeave._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (leave: Leave) => {
    setEditingLeave(leave);
    reset({
      leaveType: leave.leaveType as any,
      startDate: format(new Date(leave.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(leave.endDate), 'yyyy-MM-dd'),
      reason: leave.reason,
    });
    setShowModal(true);
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected', employeeName: string, comments?: string) => {
    if (status === 'rejected') {
      // Hiển thị modal để nhập lý do từ chối
      setPendingReject({ id, employeeName });
      setShowCommentModal(true);
    } else {
      // Duyệt đơn - không cần lý do
      const confirmed = await confirm({
        title: 'Xác nhận duyệt đơn nghỉ phép',
        message: `Bạn có chắc chắn muốn duyệt đơn nghỉ phép của "${employeeName}" không?`,
        confirmText: 'Duyệt',
        cancelText: 'Hủy',
        type: 'info',
      });
      
      if (confirmed) {
        approveMutation.mutate({ id, status, comments });
      }
    }
  };

  const handleConfirmReject = (comment: string) => {
    if (pendingReject) {
      approveMutation.mutate({ 
        id: pendingReject.id, 
        status: 'rejected', 
        comments: comment || undefined 
      });
      setShowCommentModal(false);
      setPendingReject(null);
    }
  };

  const handleDeleteLeave = async (leaveId: string, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa đơn nghỉ phép',
      message: `Bạn có chắc chắn muốn xóa đơn nghỉ phép của "${employeeName}" không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    
    if (confirmed) {
      deleteMutation.mutate(leaveId);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLeave(null);
    reset();
  };

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';
  const canApprove = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Nghỉ phép</h1>
          <p className="text-gray-600 mt-1">Danh sách đơn nghỉ phép</p>
        </div>
        {user?.role !== 'employee' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Tạo đơn nghỉ phép
          </button>
        )}
        {user?.role === 'employee' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Xin nghỉ phép
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {(isAdminOrHR || user?.role === 'manager') && <th>Nhân viên</th>}
                <th>Loại</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Số ngày</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {leavesData?.data?.map((leave: Leave) => (
                <tr key={leave._id}>
                  {(isAdminOrHR || user?.role === 'manager') && (
                    <td>
                      {leave.employee.firstName} {leave.employee.lastName}
                      <br />
                      <span className="text-xs text-gray-500">{leave.employee.employeeId}</span>
                    </td>
                  )}
                  <td className="capitalize">{leave.leaveType}</td>
                  <td>{format(new Date(leave.startDate), 'dd/MM/yyyy')}</td>
                  <td>{format(new Date(leave.endDate), 'dd/MM/yyyy')}</td>
                  <td>{leave.days}</td>
                  <td className="max-w-xs truncate">{leave.reason}</td>
                  <td>
                    <span className={`badge ${
                      leave.status === 'approved' ? 'badge-success' :
                      leave.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {canApprove && leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(leave._id, 'approved', `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim())}
                            className="text-green-600 hover:text-green-800"
                            title="Duyệt"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleApprove(
                              leave._id,
                              'rejected',
                              `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim()
                            )}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Từ chối"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {leave.status === 'pending' && (
                        <>
                          {/* Employee chỉ edit/delete được đơn của mình */}
                          {(user?.role !== 'employee' || 
                            (typeof leave.employee === 'object' && leave.employee.employeeId === user?.employeeId) ||
                            (typeof leave.employee === 'string' && leave.employee === user?.employeeId)) && (
                            <>
                              <button
                                onClick={() => handleEdit(leave)}
                                className="text-primary-600 hover:text-primary-800"
                                title="Chỉnh sửa"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteLeave(
                                  leave._id,
                                  typeof leave.employee === 'object' 
                                    ? `${leave.employee.firstName} ${leave.employee.lastName}`
                                    : 'Nhân viên'
                                )}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Xóa đơn"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingLeave ? 'Chỉnh sửa đơn nghỉ phép' : user?.role === 'employee' ? 'Xin nghỉ phép' : 'Tạo đơn nghỉ phép'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {(isAdminOrHR || user?.role === 'manager') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhân viên *
                  </label>
                  <select {...register('employee', { required: isAdminOrHR || user?.role === 'manager' })} className="input">
                    <option value="">Chọn nhân viên</option>
                    {employees?.data?.map((emp: any) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeId}
                      </option>
                    ))}
                  </select>
                  {errors.employee && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại nghỉ phép *
                </label>
                <select {...register('leaveType', { required: true })} className="input">
                  <option value="annual">Nghỉ phép năm</option>
                  <option value="sick">Nghỉ ốm</option>
                  <option value="personal">Nghỉ cá nhân</option>
                  <option value="maternity">Nghỉ thai sản</option>
                  <option value="paternity">Nghỉ thai sản (chồng)</option>
                  <option value="unpaid">Nghỉ không lương</option>
                </select>
                {errors.leaveType && <p className="text-red-600 text-sm">Bắt buộc</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    {...register('startDate', { required: true })}
                    className="input"
                  />
                  {errors.startDate && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    {...register('endDate', { required: true })}
                    className="input"
                  />
                  {errors.endDate && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do *
                </label>
                <textarea
                  {...register('reason', { required: true })}
                  className="input"
                  rows={4}
                  placeholder="Nhập lý do nghỉ phép..."
                />
                {errors.reason && <p className="text-red-600 text-sm">Bắt buộc</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLeave ? 'Cập nhật' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {ConfirmDialog}
      <CommentModal
        isOpen={showCommentModal}
        title="Từ chối đơn nghỉ phép"
        message={pendingReject ? `Nhập lý do từ chối đơn nghỉ phép của "${pendingReject.employeeName}" (tùy chọn):` : ''}
        placeholder="Nhập lý do từ chối (nếu có)..."
        confirmText="Từ chối"
        cancelText="Hủy"
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setShowCommentModal(false);
          setPendingReject(null);
        }}
      />
    </div>
  );
};

export default Leaves;

