import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';
import { Plus, Edit, Trash2, Bell, AlertCircle, Info, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'company' | 'news' | 'event' | 'policy';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishDate: string;
  expiryDate?: string;
  status: 'draft' | 'published' | 'archived';
}

const Announcements: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'company' as 'company' | 'news' | 'event' | 'policy',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    publishDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    status: 'published' as 'draft' | 'published' | 'archived',
  });

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin;

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const submitData = {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      };
      if (selectedAnnouncement) {
        return await api.put(`/announcements/${selectedAnnouncement._id}`, submitData);
      } else {
        return await api.post('/announcements', submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showToast(
        selectedAnnouncement ? 'Cập nhật thông báo thành công' : 'Tạo thông báo thành công',
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
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showToast('Xóa thông báo thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa thất bại', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'company',
      priority: 'normal',
      publishDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: '',
      status: 'published',
    });
    setSelectedAnnouncement(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      publishDate: format(new Date(announcement.publishDate), 'yyyy-MM-dd'),
      expiryDate: announcement.expiryDate
        ? format(new Date(announcement.expiryDate), 'yyyy-MM-dd')
        : '',
      status: announcement.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (announcement: Announcement) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa thông báo "${announcement.title}"?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(announcement._id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
      high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      normal: { label: 'Bình thường', color: 'bg-blue-100 text-blue-800' },
      low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
    };
    const priorityInfo = priorityMap[priority] || priorityMap.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Bell className="text-blue-500" size={20} />;
      case 'news':
        return <Info className="text-green-500" size={20} />;
      case 'event':
        return <Calendar className="text-purple-500" size={20} />;
      case 'policy':
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const announcements: Announcement[] = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Thông báo nội bộ</h1>
        {canEdit && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Tạo thông báo
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement._id}
            className="card hover:shadow-lg transition-shadow border-l-4 border-l-primary-500"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">{getTypeIcon(announcement.type)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{format(new Date(announcement.publishDate), 'dd/MM/yyyy HH:mm')}</span>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit size={18} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(announcement)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="card text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Chưa có thông báo</p>
        </div>
      )}

      {/* Announcement Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedAnnouncement ? 'Chỉnh sửa thông báo' : 'Tạo thông báo'}
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
                    placeholder="Tiêu đề thông báo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input w-full"
                    rows={8}
                    placeholder="Nội dung thông báo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'company' | 'news' | 'event' | 'policy',
                        })
                      }
                      className="input w-full"
                    >
                      <option value="company">Thông báo công ty</option>
                      <option value="news">Tin tức</option>
                      <option value="event">Sự kiện</option>
                      <option value="policy">Chính sách</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mức ưu tiên <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent',
                        })
                      }
                      className="input w-full"
                    >
                      <option value="low">Thấp</option>
                      <option value="normal">Bình thường</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày đăng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.publishDate}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="input w-full"
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
                        status: e.target.value as 'draft' | 'published' | 'archived',
                      })
                    }
                    className="input w-full"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Đã đăng</option>
                    <option value="archived">Lưu trữ</option>
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
                  {saveMutation.isPending ? 'Đang lưu...' : selectedAnnouncement ? 'Cập nhật' : 'Đăng thông báo'}
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

export default Announcements;


