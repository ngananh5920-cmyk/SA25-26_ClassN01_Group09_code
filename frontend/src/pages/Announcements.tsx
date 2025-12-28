import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const canEdit = isAdmin || isHR;

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data.data || [];
    },
  });

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
        <h1 className="text-3xl font-bold text-gray-800">Thông báo & Nội bộ</h1>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Tạo Thông báo
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
                      <button className="text-primary-600 hover:text-primary-900">
                        <Edit size={18} />
                      </button>
                      {isAdmin && (
                        <button className="text-red-600 hover:text-red-900">
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
          <p className="text-gray-600">Chưa có thông báo nào</p>
        </div>
      )}
    </div>
  );
};

export default Announcements;

