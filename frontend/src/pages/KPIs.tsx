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
            onClick={() => setIsModalOpen(true)}
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
                    Chưa có KPI nào
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
                        onClick={() => {
                          setSelectedKPI(kpi);
                          setIsModalOpen(true);
                        }}
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
    </div>
  );
};

export default KPIs;

