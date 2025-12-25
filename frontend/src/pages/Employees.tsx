import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loading } from '../components/Loading';
import { useConfirm } from '../hooks/useConfirm';

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  department: { name: string };
  position: { title: string };
  salary: number;
  hireDate: string;
  status: string;
}

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
}

const Employees: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>();
  
  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: async () => {
      const response = await api.get(`/employees?search=${search}`);
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

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get('/positions');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeForm) => {
      const response = await api.post('/employees', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      reset();
      showToast('Đã tạo nhân viên thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeForm }) => {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setEditingEmployee(null);
      reset();
      showToast('Đã cập nhật nhân viên thành công!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhân viên', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate tất cả queries liên quan để cập nhật UI
      // Không invalidate positions vì không liên quan đến việc xóa employee
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['employeeStats'] });
      showToast(data?.message || 'Đã xóa nhân viên và tất cả dữ liệu liên quan thành công!', 'success');
    },
    onError: (error: any) => {
      console.error('Error deleting employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa nhân viên';
      showToast(errorMessage, 'error');
    },
  });

  const onSubmit = (data: EmployeeForm) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: format(new Date(employee.dateOfBirth), 'yyyy-MM-dd'),
      gender: employee.gender as any,
      address: '',
      department: (employee.department as any)._id || employee.department,
      position: (employee.position as any)._id || employee.position,
      salary: employee.salary,
      hireDate: format(new Date(employee.hireDate), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    reset();
  };

  const handleDelete = async (employeeId: string, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa nhân viên',
      message: `Bạn có chắc chắn muốn xóa nhân viên "${employeeName}" không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    
    if (confirmed) {
      deleteMutation.mutate(employeeId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
          <p className="text-gray-600 mt-1">Danh sách và thông tin nhân viên</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Thêm nhân viên
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading size={48} />
          </div>
        ) : !employeesData?.data || employeesData.data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không có nhân viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Lương</th>
                  <th>Trạng thái</th>
                  {canEdit && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {employeesData.data.map((employee: Employee) => (
                  <tr key={employee._id}>
                    <td className="font-medium">{employee.employeeId}</td>
                    <td>
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td>{employee.email}</td>
                    <td>{(employee.department as any)?.name || employee.department}</td>
                    <td>{(employee.position as any)?.title || employee.position}</td>
                    <td>{employee.salary.toLocaleString('vi-VN')} VNĐ</td>
                    <td>
                      <span className={`badge ${
                        employee.status === 'active' ? 'badge-success' :
                        employee.status === 'inactive' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Edit size={18} />
                          </button>
                        <button
                          onClick={() => handleDelete(employee._id, `${employee.firstName} ${employee.lastName}`)}
                          className="text-red-600 hover:text-red-800 transition-colors"
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ *
                  </label>
                  <input {...register('firstName', { required: true })} className="input" />
                  {errors.firstName && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên *
                  </label>
                  <input {...register('lastName', { required: true })} className="input" />
                  {errors.lastName && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input type="email" {...register('email', { required: true })} className="input" />
                  {errors.email && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input {...register('phone', { required: true })} className="input" />
                  {errors.phone && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth', { required: true })}
                    className="input"
                  />
                  {errors.dateOfBirth && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính *
                  </label>
                  <select {...register('gender', { required: true })} className="input">
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
                <input {...register('address', { required: true })} className="input" />
                {errors.address && <p className="text-red-600 text-sm">Bắt buộc</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chức vụ *
                  </label>
                  <select {...register('position', { required: true })} className="input">
                    <option value="">Chọn chức vụ</option>
                    {positions?.data?.map((pos: any) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.title}
                      </option>
                    ))}
                  </select>
                  {errors.position && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương *
                  </label>
                  <input
                    type="number"
                    {...register('salary', { required: true, valueAsNumber: true })}
                    className="input"
                  />
                  {errors.salary && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày vào làm *
                  </label>
                  <input
                    type="date"
                    {...register('hireDate', { required: true })}
                    className="input"
                  />
                  {errors.hireDate && <p className="text-red-600 text-sm">Bắt buộc</p>}
                </div>
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
                  {editingEmployee ? 'Cập nhật' : 'Tạo mới'}
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

