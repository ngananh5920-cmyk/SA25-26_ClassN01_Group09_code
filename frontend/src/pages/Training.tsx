import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface Training {
  _id: string;
  title: string;
  description: string;
  type: 'internal' | 'external' | 'online' | 'workshop';
  instructor?: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxParticipants?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  enrollments?: TrainingEnrollment[];
}

interface TrainingEnrollment {
  _id: string;
  employee: { firstName: string; lastName: string };
  status: 'enrolled' | 'attending' | 'completed' | 'dropped';
  progress?: number;
}

const Training: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const canEdit = isAdmin || isHR;

  const { data, isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const response = await api.get('/training');
      return response.data.data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      scheduled: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || statusMap.scheduled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      internal: 'Nội bộ',
      external: 'Bên ngoài',
      online: 'Trực tuyến',
      workshop: 'Workshop',
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const trainings: Training[] = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Đào tạo & Phát triển</h1>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Tạo Khóa đào tạo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div key={training._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{training.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(training.status)}
                  <span className="text-xs text-gray-500">{getTypeLabel(training.type)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{training.description}</p>

            <div className="space-y-2 text-sm text-gray-500 mb-4">
              {training.instructor && (
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{training.instructor}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {format(new Date(training.startDate), 'dd/MM/yyyy')} -{' '}
                  {format(new Date(training.endDate), 'dd/MM/yyyy')}
                </span>
              </div>
              {training.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{training.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>
                  {training.enrollments?.length || 0}
                  {training.maxParticipants ? `/${training.maxParticipants}` : ''} học viên
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedTraining(training);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  <Edit size={16} className="mr-1" /> Sửa
                </button>
                {isAdmin && (
                  <button className="btn btn-danger text-sm">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {trainings.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Chưa có khóa đào tạo nào</p>
        </div>
      )}
    </div>
  );
};

export default Training;

