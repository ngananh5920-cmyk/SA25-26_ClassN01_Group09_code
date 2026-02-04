import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
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
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'internal' as 'internal' | 'external' | 'online' | 'workshop',
    instructor: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
    status: 'scheduled' as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
  });

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

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const submitData = {
        ...data,
        maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
      };
      if (selectedTraining) {
        return await api.put(`/training/${selectedTraining._id}`, submitData);
      } else {
        return await api.post('/training', submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      showToast(
        selectedTraining ? 'Cập nhật khóa học thành công' : 'Tạo khóa học thành công',
        'success'
      );
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/training/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      showToast('Xóa khóa học thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa thất bại', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'internal',
      instructor: '',
      startDate: '',
      endDate: '',
      location: '',
      maxParticipants: '',
      status: 'scheduled',
    });
    setSelectedTraining(null);
  };

  const handleEdit = (training: Training) => {
    setSelectedTraining(training);
    setFormData({
      title: training.title,
      description: training.description,
      type: training.type,
      instructor: training.instructor || '',
      startDate: training.startDate ? format(new Date(training.startDate), 'yyyy-MM-dd') : '',
      endDate: training.endDate ? format(new Date(training.endDate), 'yyyy-MM-dd') : '',
      location: training.location || '',
      maxParticipants: training.maxParticipants?.toString() || '',
      status: training.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (training: Training) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa khóa học "${training.title}"?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(training._id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

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
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Tạo khóa học
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
                  onClick={() => handleEdit(training)}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  <Edit size={16} className="mr-1" /> Sửa
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(training)}
                    className="btn btn-danger text-sm"
                  >
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
          <p className="text-gray-600">Chưa có khóa học</p>
        </div>
      )}

      {/* Training Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedTraining ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input w-full"
                    placeholder="Ví dụ: Đào tạo kỹ năng bán hàng"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full"
                    rows={4}
                    placeholder="Mô tả chi tiết khóa học"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình thức <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'internal' | 'external' | 'online' | 'workshop',
                        })
                      }
                      className="input w-full"
                    >
                      <option value="internal">Nội bộ</option>
                      <option value="external">Bên ngoài</option>
                      <option value="online">Trực tuyến</option>
                      <option value="workshop">Workshop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                    <input
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className="input w-full"
                      placeholder="Tên giảng viên"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input w-full"
                      placeholder="Địa điểm đào tạo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số học viên tối đa
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="input w-full"
                      placeholder="Số học viên"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
                      })
                    }
                    className="input w-full"
                  >
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
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
                  {saveMutation.isPending ? 'Đang lưu...' : selectedTraining ? 'Cập nhật' : 'Tạo khóa học'}
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

export default Training;


