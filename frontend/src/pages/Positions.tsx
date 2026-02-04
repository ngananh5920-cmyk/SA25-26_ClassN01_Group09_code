import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';

interface Position {
  _id?: string;
  title: string;
  description?: string;
  department: string;
  minSalary?: number;
  maxSalary?: number;
  status: 'active' | 'inactive';
}

interface PositionResponse extends Position {
  _id: string;
  department?: { _id: string; name: string };
}

const Positions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Position>({
    defaultValues: selectedPosition || {},
  });

  // Fetch positions
  const { data: positionsData, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get('/positions');
      return (response.data.data || []) as PositionResponse[];
    },
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data.data || [];
    },
  });

  // Filter and search positions
  const filteredPositions = useMemo(() => {
    if (!positionsData) return [];
    
    return positionsData.filter((position) => {
      const matchesSearch =
        searchTerm === '' ||
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (position.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || position.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || position.department?._id === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [positionsData, searchTerm, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPositions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPositions, currentPage]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Position) => {
      if (selectedPosition?._id) {
        return api.put(`/positions/${selectedPosition._id}`, data);
      } else {
        return api.post('/positions', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      showToast(
        selectedPosition ? 'Cập nhật chức vụ thành công' : 'Thêm chức vụ thành công',
        'success'
      );
      setIsModalOpen(false);
      reset();
      setSelectedPosition(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      showToast('Xóa chức vụ thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa chức vụ thất bại', 'error');
    },
  });

  const onSubmit = (data: Position) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (position: PositionResponse) => {
    setSelectedPosition(position);
    reset({
      title: position.title,
      description: position.description || '',
      department: position.department?._id || (position.department as any) || '',
      minSalary: position.minSalary || 0,
      maxSalary: position.maxSalary || 0,
      status: position.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (position: PositionResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa chức vụ ${position.title}?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(position._id);
    }
  };

  const handleAdd = () => {
    setSelectedPosition(null);
    reset({
      title: '',
      description: '',
      department: '',
      minSalary: 0,
      maxSalary: 0,
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
        Active
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Tên chức vụ', 'Phòng ban', 'Mô tả', 'Lương tối thiểu', 'Lương tối đa', 'Trạng thái'];
    const rows = filteredPositions.map((pos) => [
      pos.title,
      pos.department?.name || '',
      pos.description || '',
      pos.minSalary?.toString() || '0',
      pos.maxSalary?.toString() || '0',
      pos.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `positions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('CSV exported successfully', 'success');
  };

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin;

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quản lý chức vụ</h1>
        <div className="flex space-x-3">
          {canEdit && filteredPositions.length > 0 && (
            <button
              onClick={exportToCSV}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>
          )}
          {canEdit && (
            <button onClick={handleAdd} className="btn btn-primary">
              + Thêm chức vụ
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-premium p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="all">All</option>
              {departments?.map((dept: any) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
                setCurrentPage(1);
              }}
              className="btn btn-secondary w-full"
            >
              🔄 Đặt lại
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {paginatedPositions.length} / {filteredPositions.length} chức vụ
        </div>
      </div>

      {/* Positions Table */}
      <div className="card-premium overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên chức vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mức lương
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
              {paginatedPositions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? (isAdmin ? 6 : 5) : (isAdmin ? 5 : 4)} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Không có chức vụ nào'
                      : 'Không có chức vụ nào'}
                  </td>
                </tr>
              ) : (
                paginatedPositions.map((position) => (
                  <tr key={position._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {position.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {position.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {position.description || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {position.minSalary || position.maxSalary ? (
                          <span>
                            {position.minSalary ? formatCurrency(position.minSalary) : '-'} -{' '}
                            {position.maxSalary ? formatCurrency(position.maxSalary) : '-'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(position.status)}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(position)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                        ✏️ Sửa
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(position)}
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
                  ‹ Prev
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
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Position Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedPosition ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chức vụ *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Tên chức vụ là bắt buộc' })}
                  className="input"
                  placeholder="Kỹ sư phần mềm"
                />
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban *
                </label>
                <select
                  {...register('department', { required: 'Phòng ban là bắt buộc' })}
                  className="input"
                >
                  <option value="">Chọn phòng ban</option>
                  {departments?.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-600 text-xs mt-1">{errors.department.message}</p>
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
                  placeholder="Mô tả về chức vụ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương tối thiểu
                  </label>
                  <input
                    type="number"
                    {...register('minSalary', { min: 0 })}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương tối đa
                  </label>
                  <input
                    type="number"
                    {...register('maxSalary', { min: 0 })}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái *
                </label>
                <select {...register('status')} className="input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedPosition(null);
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
                    : selectedPosition
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

export default Positions;
