import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { Plus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Salary {
  _id: string;
  employee: { firstName: string; lastName: string; employeeId: string };
  baseSalary: number;
  allowances: { housing?: number; transportation?: number; meal?: number; other?: number };
  deductions: { tax?: number; insurance?: number; other?: number };
  month: number;
  year: number;
  netSalary: number;
  status: string;
  paymentDate?: string;
}

interface SalaryForm {
  employee: string;
  baseSalary: number;
  month: number;
  year: number;
  allowances: { housing?: number; transportation?: number; meal?: number; other?: number };
  deductions: { tax?: number; insurance?: number; other?: number };
}

const Salaries: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SalaryForm>();

  const { data: salariesData } = useQuery({
    queryKey: ['salaries', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get(`/salaries?month=${selectedMonth}&year=${selectedYear}`);
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
    mutationFn: async (data: SalaryForm) => {
      const response = await api.post('/salaries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setShowModal(false);
      reset();
      showToast('Đã tạo bảng lương thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bảng lương', 'error');
    },
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      const response = await api.post('/salaries/process-payroll', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      showToast('Xử lý lương thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý lương', 'error');
    },
  });

  const onSubmit = (data: SalaryForm) => {
    createMutation.mutate(data);
  };

  const handleProcessPayroll = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận xử lý lương',
      message: `Bạn có chắc chắn muốn xử lý lương cho tháng ${selectedMonth}/${selectedYear} không?`,
      confirmText: 'Xử lý',
      cancelText: 'Hủy',
      type: 'info',
    });
    
    if (confirmed) {
      processPayrollMutation.mutate({ month: selectedMonth, year: selectedYear });
    }
  };

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Lương</h1>
          <p className="text-gray-600 mt-1">Danh sách lương nhân viên</p>
        </div>
        <div className="flex space-x-3">
          {isAdminOrHR && (
            <>
              <button
                onClick={handleProcessPayroll}
                className="btn btn-secondary flex items-center"
              >
                <DollarSign size={20} className="mr-2" />
                Xử lý lương
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Thêm bảng lương
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input w-32"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input w-32"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {isAdminOrHR && <th>Nhân viên</th>}
                <th>Lương cơ bản</th>
                <th>Phụ cấp</th>
                <th>Khấu trừ</th>
                <th>Lương thực nhận</th>
                <th>Trạng thái</th>
                <th>Ngày thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {salariesData?.data?.map((salary: Salary) => (
                <tr key={salary._id}>
                  {isAdminOrHR && (
                    <td>
                      {salary.employee.firstName} {salary.employee.lastName}
                      <br />
                      <span className="text-xs text-gray-500">{salary.employee.employeeId}</span>
                    </td>
                  )}
                  <td>{salary.baseSalary.toLocaleString('vi-VN')} VNĐ</td>
                  <td>
                    {(
                      (salary.allowances.housing || 0) +
                      (salary.allowances.transportation || 0) +
                      (salary.allowances.meal || 0) +
                      (salary.allowances.other || 0)
                    ).toLocaleString('vi-VN')}{' '}
                    VNĐ
                  </td>
                  <td>
                    {(
                      (salary.deductions.tax || 0) +
                      (salary.deductions.insurance || 0) +
                      (salary.deductions.other || 0)
                    ).toLocaleString('vi-VN')}{' '}
                    VNĐ
                  </td>
                  <td className="font-semibold text-green-600">
                    {salary.netSalary.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td>
                    <span className={`badge ${
                      salary.status === 'paid' ? 'badge-success' :
                      salary.status === 'pending' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {salary.status}
                    </span>
                  </td>
                  <td>
                    {salary.paymentDate
                      ? format(new Date(salary.paymentDate), 'dd/MM/yyyy')
                      : '-'}
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Thêm bảng lương</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhân viên *
                  </label>
                  <select {...register('employee', { required: true })} className="input">
                    <option value="">Chọn nhân viên</option>
                    {employees?.data?.map((emp: any) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeId}
                      </option>
                    ))}
                  </select>
                  {errors.employee && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương cơ bản *
                  </label>
                  <input
                    type="number"
                    {...register('baseSalary', { required: true, valueAsNumber: true })}
                    className="input"
                  />
                  {errors.baseSalary && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tháng *
                  </label>
                  <select {...register('month', { required: true, valueAsNumber: true })} className="input">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        Tháng {month}
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
                    {...register('year', { required: true, valueAsNumber: true })}
                    className="input"
                    defaultValue={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Phụ cấp</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhà ở
                    </label>
                    <input
                      type="number"
                      {...register('allowances.housing', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đi lại
                    </label>
                    <input
                      type="number"
                      {...register('allowances.transportation', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ăn uống
                    </label>
                    <input
                      type="number"
                      {...register('allowances.meal', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khác
                    </label>
                    <input
                      type="number"
                      {...register('allowances.other', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Khấu trừ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế
                    </label>
                    <input
                      type="number"
                      {...register('deductions.tax', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo hiểm
                    </label>
                    <input
                      type="number"
                      {...register('deductions.insurance', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khác
                    </label>
                    <input
                      type="number"
                      {...register('deductions.other', { valueAsNumber: true })}
                      className="input"
                      defaultValue={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo mới
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

export default Salaries;

