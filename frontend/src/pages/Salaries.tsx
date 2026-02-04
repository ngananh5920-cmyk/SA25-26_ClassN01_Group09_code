import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';

interface Salary {
  _id?: string;
  employee: string;
  baseSalary: number;
  allowances: {
    housing?: number;
    transportation?: number;
    meal?: number;
    other?: number;
  };
  deductions: {
    tax?: number;
    insurance?: number;
    other?: number;
  };
  month: number;
  year: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: string;
  notes?: string;
}

interface SalaryResponse extends Salary {
  _id: string;
  netSalary: number;
  employee?: { _id: string; firstName: string; lastName: string; email: string };
}

const Salaries: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryResponse | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Salary>({
    defaultValues: selectedSalary || {
      allowances: {},
      deductions: {},
    },
  });

  const baseSalary = watch('baseSalary') || 0;
  const allowances = watch('allowances') || {};
  const deductions = watch('deductions') || {};

  // Calculate net salary
  const calculateNetSalary = () => {
    const totalAllowances =
      (allowances.housing || 0) +
      (allowances.transportation || 0) +
      (allowances.meal || 0) +
      (allowances.other || 0);
    const totalDeductions =
      (deductions.tax || 0) +
      (deductions.insurance || 0) +
      (deductions.other || 0);
    return baseSalary + totalAllowances - totalDeductions;
  };

  // Fetch salaries
  const { data: salaries, isLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: async () => {
      const response = await api.get('/salaries');
      return (response.data.data || []) as SalaryResponse[];
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
    mutationFn: async (data: Salary) => {
      const submitData = {
        ...data,
        netSalary: calculateNetSalary(),
      };
      if (selectedSalary?._id) {
        return api.put(`/salaries/${selectedSalary._id}`, submitData);
      } else {
        return api.post('/salaries', submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      showToast(selectedSalary ? 'Cập nhật lương thành công' : 'Thêm lương thành công', 'success');
      setIsModalOpen(false);
      reset();
      setSelectedSalary(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    },
  });

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      return api.post('/salaries/process-payroll', data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      const message = response.data?.message || 'Xử lý lương thành công';
      const toastType = response.data?.alreadyProcessed ? 'info' : 'success';
      showToast(message, toastType);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xử lý lương thất bại', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/salaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      showToast('Xóa bản ghi lương thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa thất bại', 'error');
    },
  });

  const onSubmit = (data: Salary) => {
    saveMutation.mutate(data);
  };

  const handleProcessPayroll = async () => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const confirmed = await confirm({
      title: 'Xác nhận xử lý',
      message: `Bạn có chắc muốn xử lý payroll cho tháng ${month}/${year}?`,
      confirmText: 'Xử lý',
      cancelText: 'Hủy',
      type: 'info',
    });
    if (confirmed) {
      processPayrollMutation.mutate({ month, year });
    }
  };

  const handleEdit = (salary: SalaryResponse) => {
    setSelectedSalary(salary);
    reset({
      employee: salary.employee?._id || (salary.employee as any) || '',
      baseSalary: salary.baseSalary,
      allowances: salary.allowances || {},
      deductions: salary.deductions || {},
      month: salary.month,
      year: salary.year,
      status: salary.status,
      paymentDate: salary.paymentDate ? new Date(salary.paymentDate).toISOString().split('T')[0] : '',
      notes: salary.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (salary: SalaryResponse) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa bản ghi lương này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(salary._id);
    }
  };

  const handleAdd = () => {
    setSelectedSalary(null);
    const currentDate = new Date();
    reset({
      employee: '',
      baseSalary: 0,
      allowances: { housing: 0, transportation: 0, meal: 0, other: 0 },
      deductions: { tax: 0, insurance: 0, other: 0 },
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      status: 'pending',
      paymentDate: '',
      notes: '',
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
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getMonthName = (month: number) => {
    const months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    return months[month - 1] || '';
  };

  // Check if payroll has been processed for a specific month/year
  const isPayrollProcessed = (month: number, year: number) => {
    if (!salaries || salaries.length === 0) return false;
    return salaries.some((salary) => salary.month === month && salary.year === year);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý lương</h1>
          {canEdit && (
            <div className="mt-2 flex items-center gap-2">
              {(() => {
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth() + 1;
                const currentYear = currentDate.getFullYear();
                const processed = isPayrollProcessed(currentMonth, currentYear);
                return processed ? (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Đã xử lý lương tháng {currentMonth}/{currentYear}
                  </span>
                ) : (
                  <span className="text-sm text-yellow-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Chưa xử lý lương tháng {currentMonth}/{currentYear}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
        <div className="space-x-3">
          {canEdit && (
            <button
              onClick={handleProcessPayroll}
              className="btn btn-secondary"
              disabled={processPayrollMutation.isPending}
            >
              {processPayrollMutation.isPending ? 'Đang xử lý...' : 'Xử lý Payroll'}
            </button>
          )}
          {canEdit && (
            <button onClick={handleAdd} className="btn btn-primary">
              + Thêm bản ghi lương
            </button>
          )}
        </div>
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tháng/Năm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lương cơ bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phụ cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khấu trừ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lương thực nhận
                </th>
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
              {!salaries || salaries.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    Không có bản ghi lương nào
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => {
                  const totalAllowances =
                    (salary.allowances?.housing || 0) +
                    (salary.allowances?.transportation || 0) +
                    (salary.allowances?.meal || 0) +
                    (salary.allowances?.other || 0);
                  const totalDeductions =
                    (salary.deductions?.tax || 0) +
                    (salary.deductions?.insurance || 0) +
                    (salary.deductions?.other || 0);

                  return (
                    <tr key={salary._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salary.employee
                          ? `${salary.employee.firstName} ${salary.employee.lastName}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getMonthName(salary.month)}/{salary.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(salary.baseSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(totalAllowances)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(salary.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(salary.status)}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(salary)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(salary)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedSalary ? 'Chỉnh sửa bản ghi lương' : 'Thêm bản ghi lương'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên *
                </label>
                <select
                  {...register('employee', { required: 'Nhân viên là bắt buộc' })}
                  className="input"
                  disabled={!!selectedSalary}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tháng *
                  </label>
                  <select
                    {...register('month', { required: 'Tháng là bắt buộc', valueAsNumber: true })}
                    className="input"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm *
                  </label>
                  <input
                    type="number"
                    {...register('year', {
                      required: 'Năm là bắt buộc',
                      valueAsNumber: true,
                      min: 2000,
                      max: 2100,
                    })}
                    className="input"
                    min="2000"
                    max="2100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lương cơ bản *
                </label>
                <input
                  type="number"
                  {...register('baseSalary', { required: 'Lương cơ bản là bắt buộc', min: 0, valueAsNumber: true })}
                  className="input"
                  min="0"
                />
                {errors.baseSalary && (
                  <p className="text-red-600 text-xs mt-1">{errors.baseSalary.message}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Phụ cấp</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhà ở
                    </label>
                    <input
                      type="number"
                      {...register('allowances.housing', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đi lại
                    </label>
                    <input
                      type="number"
                      {...register('allowances.transportation', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ăn uống
                    </label>
                    <input
                      type="number"
                      {...register('allowances.meal', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khác
                    </label>
                    <input
                      type="number"
                      {...register('allowances.other', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Khấu trừ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế
                    </label>
                    <input
                      type="number"
                      {...register('deductions.tax', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo hiểm
                    </label>
                    <input
                      type="number"
                      {...register('deductions.insurance', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khác
                    </label>
                    <input
                      type="number"
                      {...register('deductions.other', { valueAsNumber: true, min: 0 })}
                      className="input"
                      min="0"
                      defaultValue={0}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Lương thực nhận:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(calculateNetSalary())}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày thanh toán
                  </label>
                  <input type="date" {...register('paymentDate')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái *
                  </label>
                  <select {...register('status')} className="input">
                    <option value="pending">Chờ thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  {...register('notes')}
                  className="input"
                  rows={2}
                  placeholder="Ghi chú (nếu có)..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedSalary(null);
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
                    : selectedSalary
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

export default Salaries;
