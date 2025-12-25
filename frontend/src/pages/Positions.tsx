import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { useAuth } from '../contexts/AuthContext';

interface Position {
  _id: string;
  title: string;
  description?: string;
  department: { _id: string; name: string };
  minSalary?: number;
  maxSalary?: number;
  status: string;
}

interface PositionForm {
  title: string;
  description?: string;
  department: string;
  minSalary?: number;
  maxSalary?: number;
  status: 'active' | 'inactive';
}

const Positions: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PositionForm>();

  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get('/positions');
      return response.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PositionForm) => {
      const response = await api.post('/positions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setShowModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PositionForm }) => {
      const response = await api.put(`/positions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setShowModal(false);
      setEditingPosition(null);
      reset();
      showToast('Đã cập nhật chức vụ thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chức vụ', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      showToast('Đã xóa chức vụ thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xóa chức vụ', 'error');
    },
  });

  const onSubmit = (data: PositionForm) => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    reset({
      title: position.title,
      description: position.description || '',
      department: position.department._id,
      minSalary: position.minSalary,
      maxSalary: position.maxSalary,
      status: position.status as 'active' | 'inactive',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosition(null);
    reset();
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa chức vụ "${title}" không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chức vụ</h1>
          <p className="text-gray-600 mt-1">Danh sách và thông tin chức vụ</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Thêm chức vụ
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tên chức vụ</th>
                <th>Phòng ban</th>
                <th>Lương tối thiểu</th>
                <th>Lương tối đa</th>
                <th>Trạng thái</th>
                {canEdit && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {positionsData?.data?.map((position: Position) => (
                <tr key={position._id}>
                  <td className="font-medium">{position.title}</td>
                  <td>{position.department.name}</td>
                  <td>
                    {position.minSalary
                      ? `${position.minSalary.toLocaleString('vi-VN')} VNĐ`
                      : '-'}
                  </td>
                  <td>
                    {position.maxSalary
                      ? `${position.maxSalary.toLocaleString('vi-VN')} VNĐ`
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge ${
                      position.status === 'active' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {position.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(position)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(position._id, position.title)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xóa chức vụ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
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
              {editingPosition ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chức vụ *
                </label>
                <input {...register('title', { required: true })} className="input" />
                {errors.title && <p className="text-red-600 text-sm">Bắt buộc</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  {...register('description')}
                  className="input"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban *
                </label>
                <select {...register('department', { required: true })} className="input">
                  <option value="">Chọn phòng ban</option>
                  {departments?.data?.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-600 text-sm">Bắt buộc</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương tối thiểu
                  </label>
                  <input
                    type="number"
                    {...register('minSalary', { valueAsNumber: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương tối đa
                  </label>
                  <input
                    type="number"
                    {...register('maxSalary', { valueAsNumber: true })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái *
                </label>
                <select {...register('status', { required: true })} className="input">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
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
                  {editingPosition ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
};

export default Positions;

