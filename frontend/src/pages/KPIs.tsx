import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import { Plus, Edit, CheckCircle, Star } from 'lucide-react';

interface KPI {
  _id: string;
  employee: { _id: string; firstName: string; lastName: string; employeeId: string };
  period: {
    type: 'monthly' | 'quarterly' | 'yearly';
    month?: number;
    quarter?: number;
    year: number;
  };
  goals: Array<{
    name: string;
    target: number;
    actual?: number;
    weight: number;
    unit?: string;
  }>;
  overallScore?: number;
  rating?: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
}

const KPIs: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    employee: '',
    periodType: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    month: new Date().getMonth() + 1,
    quarter: 1,
    year: new Date().getFullYear(),
    goals: [{ name: '', target: 0, weight: 25, unit: '' }],
    status: 'draft' as 'draft' | 'submitted' | 'reviewed' | 'approved',
  });

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isHR || isManager;

  const { data, isLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const response = await api.get('/kpis');
      return response.data.data || [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data.data || [];
    },
    enabled: canManage && isModalOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const period: any = {
        type: data.periodType,
        year: data.year,
      };
      if (data.periodType === 'monthly') period.month = data.month;
      if (data.periodType === 'quarterly') period.quarter = data.quarter;

      const submitData = {
        employee: data.employee,
        period,
        goals: data.goals.filter((g: any) => g.name.trim() !== ''),
        status: data.status,
      };

      if (selectedKPI) {
        return await api.put(`/kpis/${selectedKPI._id}`, submitData);
      } else {
        return await api.post('/kpis', submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      showToast(selectedKPI ? 'Cập nhật KPI thành công' : 'Tạo KPI thành công', 'success');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      employee: '',
      periodType: 'monthly',
      month: new Date().getMonth() + 1,
      quarter: 1,
      year: new Date().getFullYear(),
      goals: [{ name: '', target: 0, weight: 25, unit: '' }],
      status: 'draft',
    });
    setSelectedKPI(null);
  };

  const handleEdit = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setFormData({
      employee: kpi.employee._id,
      periodType: kpi.period.type,
      month: kpi.period.month || new Date().getMonth() + 1,
      quarter: kpi.period.quarter || 1,
      year: kpi.period.year,
      goals: kpi.goals.length > 0 ? kpi.goals : [{ name: '', target: 0, weight: 25, unit: '' }],
      status: kpi.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const addGoal = () => {
    setFormData({
      ...formData,
      goals: [...formData.goals, { name: '', target: 0, weight: 25, unit: '' }],
    });
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    });
  };

  const updateGoal = (index: number, field: string, value: any) => {
    const newGoals = [...formData.goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setFormData({ ...formData, goals: newGoals });
  };

  const getRatingBadge = (rating?: string) => {
    if (!rating) return null;
    const ratingMap: Record<string, { label: string; color: string }> = {
      excellent: { label: 'Xuất sắc', color: 'bg-green-100 text-green-800' },
      good: { label: 'Tốt', color: 'bg-blue-100 text-blue-800' },
      average: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
      below_average: { label: 'Dưới trung bình', color: 'bg-orange-100 text-orange-800' },
      poor: { label: 'Kém', color: 'bg-red-100 text-red-800' },
    };
    const ratingInfo = ratingMap[rating] || ratingMap.average;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingInfo.color}`}>
        {ratingInfo.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Đã nộp', color: 'bg-blue-100 text-blue-800' },
      reviewed: { label: 'Đã đánh giá', color: 'bg-purple-100 text-purple-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
    };
    const statusInfo = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const kpis: KPI[] = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Đánh giá & KPI</h1>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Tạo KPI
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỳ đánh giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số mục tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm số</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xếp loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không có KPI nào
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => (
                  <tr key={kpi._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {kpi.employee.firstName} {kpi.employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{kpi.employee.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {kpi.period.type === 'monthly' && kpi.period.month
                        ? `Tháng ${kpi.period.month}/${kpi.period.year}`
                        : kpi.period.type === 'quarterly' && kpi.period.quarter
                        ? `Q${kpi.period.quarter}/${kpi.period.year}`
                        : `Năm ${kpi.period.year}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kpi.goals.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {kpi.overallScore !== undefined ? `${kpi.overallScore.toFixed(1)}/100` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRatingBadge(kpi.rating)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(kpi.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(kpi)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Form Modal */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedKPI ? 'Chỉnh sửa KPI' : 'Tạo KPI'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhân viên <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    className="input w-full"
                    disabled={!!selectedKPI}
                  >
                    <option value="">Chọn nhân viên</option>
                    {(employeesData || []).map((emp: any) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại kỳ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.periodType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          periodType: e.target.value as 'monthly' | 'quarterly' | 'yearly',
                        })
                      }
                      className="input w-full"
                    >
                      <option value="monthly">Tháng</option>
                      <option value="quarterly">Quý</option>
                      <option value="yearly">Năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Năm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="input w-full"
                      min="2020"
                      max="2100"
                    />
                  </div>
                </div>

                {formData.periodType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      className="input w-full"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.periodType === 'quarterly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quý</label>
                    <select
                      value={formData.quarter}
                      onChange={(e) => setFormData({ ...formData, quarter: Number(e.target.value) })}
                      className="input w-full"
                    >
                      {[1, 2, 3, 4].map((q) => (
                        <option key={q} value={q}>
                          Quý {q}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mục tiêu <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.goals.map((goal, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Tên mục tiêu"
                            value={goal.name}
                            onChange={(e) => updateGoal(index, 'name', e.target.value)}
                            className="input w-full mb-2"
                            required
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              placeholder="Mục tiêu"
                              value={goal.target || ''}
                              onChange={(e) => updateGoal(index, 'target', Number(e.target.value))}
                              className="input"
                              required
                              min="0"
                            />
                            <input
                              type="number"
                              placeholder="Trọng số (%)"
                              value={goal.weight || ''}
                              onChange={(e) => updateGoal(index, 'weight', Number(e.target.value))}
                              className="input"
                              required
                              min="0"
                              max="100"
                            />
                            <input
                              type="text"
                              placeholder="Đơn vị"
                              value={goal.unit || ''}
                              onChange={(e) => updateGoal(index, 'unit', e.target.value)}
                              className="input"
                            />
                          </div>
                        </div>
                        {formData.goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGoal(index)}
                            className="btn btn-danger"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addGoal} className="btn btn-secondary text-sm">
                      + Thêm mục tiêu
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'draft' | 'submitted' | 'reviewed' | 'approved',
                      })
                    }
                    className="input w-full"
                  >
                    <option value="draft">Nháp</option>
                    <option value="submitted">Đã nộp</option>
                    <option value="reviewed">Đã đánh giá</option>
                    <option value="approved">Đã duyệt</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu...' : selectedKPI ? 'Cập nhật' : 'Tạo KPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIs;


