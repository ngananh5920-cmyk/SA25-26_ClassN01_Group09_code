import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';

interface Department {
  _id?: string;
  name: string;
  description?: string;
  manager?: string;
  budget?: number;
  status: 'active' | 'inactive';
}

interface DepartmentResponse {
  _id: string;
  name: string;
  description?: string;
  manager?: string | { _id: string; firstName: string; lastName: string };
  budget?: number;
  status: 'active' | 'inactive';
}

const Departments: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Department>();

  // Fetch departments
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return (response.data.data || []) as DepartmentResponse[];
    },
  });

  // Fetch employees for manager selection
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

  // Filter and search departments
  const filteredDepartments = useMemo(() => {
    if (!departmentsData) return [];
    
    return departmentsData.filter((department) => {
      const matchesSearch =
        searchTerm === '' ||
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (department.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || department.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [departmentsData, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Department) => {
      if (selectedDepartment?._id) {
        return api.put(`/departments/${selectedDepartment._id}`, data);
      } else {
        return api.post('/departments', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast(selectedDepartment ? 'Cập nhật phòng ban thành công' : 'Thêm phòng ban thành công', 'success');
      setIsModalOpen(false);
      reset();
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Thao tác thất bại', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Xóa phòng ban thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa phòng ban thất bại', 'error');
    },
  });

  const onSubmit = (data: Department) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (department: DepartmentResponse) => {
    setSelectedDepartment(department);
    const managerId = typeof department.manager === 'object' && department.manager !== null
      ? department.manager._id
      : department.manager || '';
    reset({
      name: department.name,
      description: department.description || '',
      manager: managerId,
      budget: department.budget || 0,
      status: department.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (department: DepartmentResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa phòng ban ${department.name}?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(department._id);
    }
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    reset({
      name: '',
      description: '',
      manager: '',
      budget: 0,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Hoạt động
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Không hoạt động
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Tên Phòng ban', 'Mô tả', 'Trưởng phòng', 'Ngân sách', 'Trạng thái'];
    const rows = filteredDepartments.map((dept) => {
      const managerName = typeof dept.manager === 'object' && dept.manager !== null
        ? `${dept.manager.firstName} ${dept.manager.lastName}`
        : '';
      return [
        dept.name,
        dept.description || '',
        managerName,
        dept.budget?.toString() || '0',
        dept.status,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `departments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Xuất file CSV thành công', 'success');
  };

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const canEdit = isAdmin || isHR;

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quản lý Phòng ban</h1>
        <div className="flex space-x-3">
          {canEdit && filteredDepartments.length > 0 && (
            <button
              onClick={exportToCSV}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Xuất CSV</span>
            </button>
          )}
          {canEdit && (
            <button onClick={handleAdd} className="btn btn-primary">
              + Thêm Phòng ban
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-premium p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
              placeholder="Tên, mô tả..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="btn btn-secondary w-full"
            >
              🔄 Đặt lại
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {paginatedDepartments.length} / {filteredDepartments.length} phòng ban
        </div>
      </div>

      {/* Departments Table */}
      <div className="card-premium overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trưởng phòng
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngân sách
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDepartments.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? (isAdmin ? 6 : 5) : (isAdmin ? 5 : 4)} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Không tìm thấy phòng ban nào'
                      : 'Chưa có phòng ban nào'}
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((department) => (
                  <tr key={department._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {department.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof department.manager === 'object' && department.manager !== null
                        ? `${department.manager.firstName} ${department.manager.lastName}`
                        : '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {department.budget ? formatCurrency(department.budget) : '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(department.status)}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(department)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          ✏️ Sửa
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(department)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Trang <span className="font-medium">{currentPage}</span> /{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹ Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`btn ${
                      currentPage === page ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Department Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedDepartment ? 'Sửa Phòng ban' : 'Thêm Phòng ban'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Phòng ban *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Tên phòng ban là bắt buộc' })}
                  className="input"
                  placeholder="Phòng IT"
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  {...register('description')}
                  className="input"
                  rows={3}
                  placeholder="Mô tả về phòng ban..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng phòng
                </label>
                <select {...register('manager')} className="input">
                  <option value="">Chọn trưởng phòng</option>
                  {employees?.map((emp: any) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
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
                  {...register('budget', { min: 0 })}
                  className="input"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái *
                </label>
                <select {...register('status')} className="input">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedDepartment(null);
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
                  {saveMutation.isPending
                    ? 'Đang lưu...'
                    : selectedDepartment
                    ? 'Cập nhật'
                    : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
