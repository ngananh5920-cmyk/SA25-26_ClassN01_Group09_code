import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  _id: string;
  name: string;
  description?: string;
  manager?: { firstName: string; lastName: string; employeeId: string };
  budget?: number;
  status: string;
}

interface DepartmentForm {
  name: string;
  description?: string;
  manager?: string;
  budget?: number;
  status: 'active' | 'inactive';
}

const Departments: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentForm>();

  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees?limit=1000');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentForm) => {
      const response = await api.post('/departments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentForm }) => {
      const response = await api.put(`/departments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowModal(false);
      setEditingDept(null);
      reset();
      showToast('Đã cập nhật phòng ban thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phòng ban', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Đã xóa phòng ban thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xóa phòng ban', 'error');
    },
  });

  const onSubmit = (data: DepartmentForm) => {
    if (editingDept) {
      updateMutation.mutate({ id: editingDept._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    reset({
      name: dept.name,
      description: dept.description || '',
      manager: (dept.manager as any)?._id || dept.manager || '',
      budget: dept.budget,
      status: dept.status as 'active' | 'inactive',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    reset();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa phòng ban "${name}" không?`,
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Phòng ban</h1>
          <p className="text-gray-600 mt-1">Danh sách và thông tin phòng ban</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Thêm phòng ban
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentsData?.data?.map((dept: Department) => (
          <div key={dept._id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{dept.name}</h3>
                <span className={`badge ${
                  dept.status === 'active' ? 'badge-success' : 'badge-danger'
                } mt-2`}>
                  {dept.status}
                </span>
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id, dept.name)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Xóa phòng ban"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            {dept.description && (
              <p className="text-gray-600 text-sm mb-3">{dept.description}</p>
            )}
            {dept.manager && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Trưởng phòng:</span>{' '}
                {dept.manager.firstName} {dept.manager.lastName}
              </p>
            )}
            {dept.budget && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-medium">Ngân sách:</span>{' '}
                {dept.budget.toLocaleString('vi-VN')} VNĐ
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phòng ban *
                </label>
                <input {...register('name', { required: true })} className="input" />
                {errors.name && <p className="text-red-600 text-sm">Bắt buộc</p>}
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
                  Trưởng phòng
                </label>
                <select {...register('manager')} className="input">
                  <option value="">Chọn trưởng phòng</option>
                  {employees?.data?.map((emp: any) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngân sách
                </label>
                <input
                  type="number"
                  {...register('budget', { valueAsNumber: true })}
                  className="input"
                />
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
                  {editingDept ? 'Cập nhật' : 'Tạo mới'}
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

export default Departments;

