import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface AuditLog {
  _id: string;
  module: string;
  action: string;
  actor: { id: string; role?: string; email?: string };
  target?: { type: string; id: string };
  metadata?: Record<string, any>;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [moduleFilter, setModuleFilter] = useState('leave');
  const [actionFilter, setActionFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', moduleFilter, actionFilter],
    queryFn: async () => {
      const params: Record<string, any> = {
        module: moduleFilter,
        limit: 100,
      };
      if (actionFilter !== 'all') params.action = actionFilter;
      const endpoint =
        moduleFilter === 'leave'
          ? '/audit-logs/leave'
          : moduleFilter === 'payroll'
          ? '/audit-logs/payroll'
          : moduleFilter === 'training'
          ? '/audit-logs/training'
          : '/audit-logs/kpi';
      const response = await api.get(endpoint, { params });
      return response.data.data || [];
    },
    enabled: isAdmin,
  });

  const logs: AuditLog[] = data || [];

  const actions = useMemo(
    () => ['all', 'create', 'update', 'approve', 'delete'],
    []
  );

  if (!isAdmin) {
    return (
      <div className="card-premium p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Audit Log</h1>
        <p className="text-gray-600">Bạn không có quyền truy cập.</p>
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Audit Log</h1>
      </div>

      <div className="card-premium p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              className="input"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="leave">Nghỉ phép</option>
              <option value="payroll">Lương</option>
              <option value="training">Đào tạo</option>
              <option value="kpi">KPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hành động</label>
            <select
              className="input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action === 'all' ? 'Tất cả' : action}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Tổng: <span className="font-semibold text-gray-700">{logs.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối tượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Không có dữ liệu audit log
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.actor?.email || log.actor?.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.target?.type || '-'} {log.target?.id ? `#${log.target.id}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.metadata?.status ? `Status: ${log.metadata.status}` : '-'}
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

export default AuditLogs;

