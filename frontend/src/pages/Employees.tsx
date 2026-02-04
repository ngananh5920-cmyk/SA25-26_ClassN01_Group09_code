import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';

interface AccountForm {
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  employeeId?: string;
}

interface Employee {
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  cccd?: string;
  department: string;
  position: string;
  manager?: string;
  salary: number;
  hireDate: string;
  contractEndDate?: string;
  status: 'active' | 'inactive' | 'terminated';
  skills?: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    certificate?: string;
  }>;
  workHistory?: Array<{
    date: string;
    type: 'promotion' | 'transfer' | 'salary_change' | 'position_change';
    description: string;
    from?: string;
    to?: string;
  }>;
}

interface EmployeeResponse extends Employee {
  _id: string;
  department?: { _id: string; name: string };
  position?: { _id: string; title: string; name: string };
}

const Employees: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Employee>({
    defaultValues: selectedEmployee || {},
  });

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    reset: resetAccountForm,
    formState: { errors: accountErrors },
  } = useForm<AccountForm>({
    defaultValues: {
      email: '',
      password: '',
      role: 'employee',
      employeeId: '',
    },
  });

  // Fetch employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return (response.data.data || []) as EmployeeResponse[];
    },
  });

  // Fetch departments and positions for form
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data.data || [];
    },
  });

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get('/positions');
      return response.data.data || [];
    },
  });

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    if (!employeesData) return [];
    
    return employeesData.filter((employee) => {
      const matchesSearch =
        searchTerm === '' ||
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || employee.department?._id === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employeesData, searchTerm, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Employee) => {
      if (selectedEmployee?._id) {
        return api.put(`/employees/${selectedEmployee._id}`, data);
      } else {
        return api.post('/employees', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast(selectedEmployee ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công', 'success');
      setIsModalOpen(false);
      reset();
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountForm) => {
      const payload: any = {
        email: data.email,
        password: data.password,
        role: data.role,
      };
      if (data.employeeId) {
        payload.employeeId = data.employeeId;
      }
      return api.post('/auth/users', payload);
    },
    onSuccess: () => {
      showToast('Tạo tài khoản thành công', 'success');
      setIsAccountModalOpen(false);
      resetAccountForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Tạo tài khoản thất bại', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['employeeStats'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast(data?.message || 'Xóa nhân viên và dữ liệu liên quan thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa nhân viên thất bại', 'error');
    },
  });

  const onSubmit = (data: Employee) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (employee: EmployeeResponse) => {
    setSelectedEmployee(employee);
    reset({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
      gender: employee.gender,
      address: employee.address,
      department: employee.department?._id || employee.department as any,
      position: employee.position?._id || employee.position as any,
      salary: employee.salary,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      status: employee.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: EmployeeResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa nhân viên ${employee.firstName} ${employee.lastName}?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(employee._id);
    }
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    reset({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      department: '',
      position: '',
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleAddAccount = (employee?: EmployeeResponse) => {
    resetAccountForm({
      email: employee?.email || '',
      password: '',
      role: 'employee',
      employeeId: employee?._id || '',
    });
    setIsAccountModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      terminated: { label: 'Đã nghỉ việc', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || statusMap.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Mã NV', 'Họ tên', 'Email', 'SĐT', 'Phòng ban', 'Chức vụ', 'Lương', 'Trạng thái'];
    const rows = filteredEmployees.map((emp) => [
      emp.employeeId,
      `${emp.firstName} ${emp.lastName}`,
      emp.email,
      emp.phone,
      emp.department?.name || '',
      emp.position?.title || emp.position?.name || '',
      emp.salary?.toString() || '0',
      emp.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('CSV exported successfully', 'success');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isHR = user?.role === 'hr';
  const canSeeSalary = isAdmin || isHR;
  const canEdit = isAdmin || isHR;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const employees = employeesData || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quản lý nhân viên</h1>
        <div className="flex space-x-3">
          {canEdit && (
            <button onClick={() => handleAddAccount()} className="btn btn-secondary">
              + Tạo tài khoản
            </button>
          )}
          {canEdit && filteredEmployees.length > 0 && (
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
              + Thêm nhân viên
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
              placeholder="Tên, email, mã NV..."
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
              <option value="terminated">Đã nghỉ việc</option>
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
          Hiển thị {paginatedEmployees.length} / {filteredEmployees.length} nhân viên
        </div>
      </div>

      {/* Employees Table */}
      <div className="card-premium overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã NV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Positions
                </th>
                {canSeeSalary && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lương
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
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? (canSeeSalary ? 8 : 7) : (canSeeSalary ? 7 : 6)} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Không có nhân viên nào'
                      : 'Không có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.position?.title || employee.position?.name || '-'}
                    </td>
                    {canSeeSalary && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(employee.salary || 0)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.status)}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleAddAccount(employee)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          👤 Tạo tài khoản
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          🗑️ Xóa
                        </button>
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

      {/* Employee Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã nhân viên *
                  </label>
                  <input
                    type="text"
                    {...register('employeeId', { required: 'Mã nhân viên là bắt buộc' })}
                    className="input"
                    placeholder="NV001"
                  />
                  {errors.employeeId && (
                    <p className="text-red-600 text-xs mt-1">{errors.employeeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email là bắt buộc' })}
                    className="input"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ *
                  </label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'Họ là bắt buộc' })}
                    className="input"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên *
                  </label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Tên là bắt buộc' })}
                    className="input"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    {...register('phone', { required: 'Số điện thoại là bắt buộc' })}
                    className="input"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính *
                  </label>
                  <select
                    {...register('gender', { required: 'Giới tính là bắt buộc' })}
                    className="input"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  {...register('address', { required: 'Địa chỉ là bắt buộc' })}
                  className="input"
                />
                {errors.address && (
                  <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth', { required: 'Ngày sinh là bắt buộc' })}
                    className="input"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày vào làm *
                  </label>
                  <input
                    type="date"
                    {...register('hireDate', { required: 'Ngày vào làm là bắt buộc' })}
                    className="input"
                  />
                  {errors.hireDate && (
                    <p className="text-red-600 text-xs mt-1">{errors.hireDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    Chức vụ *
                  </label>
                  <select
                    {...register('position', { required: 'Chức vụ là bắt buộc' })}
                    className="input"
                  >
                    <option value="">Chọn chức vụ</option>
                    {positions?.map((pos: any) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.title || pos.name}
                      </option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="text-red-600 text-xs mt-1">{errors.position.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương *
                  </label>
                  <input
                    type="number"
                    {...register('salary', { required: 'Lương là bắt buộc', min: 0 })}
                    className="input"
                    min="0"
                  />
                  {errors.salary && (
                    <p className="text-red-600 text-xs mt-1">{errors.salary.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái *
                  </label>
                  <select {...register('status')} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedEmployee(null);
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
                  {saveMutation.isPending ? 'Đang lưu...' : selectedEmployee ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAccountModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tạo tài khoản</h2>
            <form
              onSubmit={handleAccountSubmit((data) => createAccountMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  {...registerAccount('email', { required: 'Email là bắt buộc' })}
                  className="input"
                />
                {accountErrors.email && (
                  <p className="text-red-600 text-xs mt-1">{accountErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  {...registerAccount('password', { required: 'Mật khẩu là bắt buộc', minLength: 6 })}
                  className="input"
                />
                {accountErrors.password && (
                  <p className="text-red-600 text-xs mt-1">{accountErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select {...registerAccount('role')} className="input">
                  <option value="employee">Nhân viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liên kết nhân viên</label>
                <select {...registerAccount('employeeId')} className="input">
                  <option value="">Không liên kết</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    resetAccountForm();
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="btn btn-primary"
                >
                  {createAccountMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
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

export default Employees;
