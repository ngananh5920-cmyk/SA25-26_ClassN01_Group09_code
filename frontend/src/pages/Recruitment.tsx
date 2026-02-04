import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import api from '../utils/api';
import { Plus, Edit, Trash2, Users, FileText, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Recruitment {
  _id: string;
  title: string;
  department: { _id: string; name: string };
  position: { _id: string; title: string };
  description: string;
  requirements: string[];
  quantity: number;
  status: 'open' | 'closed' | 'filled';
  postedDate: string;
  deadline?: string;
  candidates?: Candidate[];
}

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  interviewDate?: string;
  rating?: number;
}

const Recruitment: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState<Recruitment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    position: '',
    description: '',
    requirements: '',
    quantity: '',
    deadline: '',
    status: 'open' as 'open' | 'closed' | 'filled',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isHR = user?.role === 'hr';
  const canEdit = isAdmin || isHR;

  const { data, isLoading } = useQuery({
    queryKey: ['recruitments'],
    queryFn: async () => {
      const response = await api.get('/recruitment');
      return response.data.data || [];
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data.data || [];
    },
    enabled: canEdit && isModalOpen,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await api.get('/positions');
      return response.data.data || [];
    },
    enabled: canEdit && isModalOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedRecruitment) {
        return await api.put(`/recruitment/${selectedRecruitment._id}`, data);
      } else {
        return await api.post('/recruitment', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitments'] });
      showToast(
        selectedRecruitment ? 'Cập nhật tin tuyển dụng thành công' : 'Đăng tin tuyển dụng thành công',
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
      await api.delete(`/recruitment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitments'] });
      showToast('Xóa tin tuyển dụng thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Xóa thất bại', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      position: '',
      description: '',
      requirements: '',
      quantity: '',
      deadline: '',
      status: 'open',
    });
    setSelectedRecruitment(null);
  };

  const handleEdit = (recruitment: Recruitment) => {
    setSelectedRecruitment(recruitment);
    setFormData({
      title: recruitment.title,
      department: recruitment.department._id,
      position: recruitment.position._id,
      description: recruitment.description,
      requirements: recruitment.requirements.join('\n'),
      quantity: recruitment.quantity.toString(),
      deadline: recruitment.deadline ? format(new Date(recruitment.deadline), 'yyyy-MM-dd') : '',
      status: recruitment.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recruitment: Recruitment) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa tin tuyển dụng "${recruitment.title}"?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(recruitment._id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      title: formData.title,
      department: formData.department,
      position: formData.position,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter((r) => r.trim()),
      quantity: Number(formData.quantity),
      status: formData.status,
    };

    if (formData.deadline) {
      submitData.deadline = formData.deadline;
    }

    saveMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      open: { label: 'Đang tuyển', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' },
      filled: { label: 'Đã đủ', color: 'bg-blue-100 text-blue-800' },
    };
    const statusInfo = statusMap[status] || statusMap.open;
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

  const recruitments: Recruitment[] = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tuyển dụng</h1>
        {canEdit && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Đăng tin tuyển dụng
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recruitments.map((recruitment) => (
          <div key={recruitment._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{recruitment.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>{recruitment.department?.name}</span>
                  <span>•</span>
                  <span>{recruitment.position?.title}</span>
                </div>
                {getStatusBadge(recruitment.status)}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{recruitment.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{recruitment.candidates?.length || 0} ứng viên</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{format(new Date(recruitment.postedDate), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(recruitment)}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  <Edit size={16} className="mr-1" /> Sửa
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(recruitment)}
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

      {recruitments.length === 0 && (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Chưa có tin tuyển dụng</p>
        </div>
      )}

      {/* Recruitment Form Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedRecruitment ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
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
                    placeholder="Ví dụ: Chuyên viên phát triển kinh doanh"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Chọn phòng ban</option>
                      {(departmentsData || []).map((dept: any) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Chọn chức vụ</option>
                      {(positionsData || []).map((pos: any) => (
                        <option key={pos._id} value={pos._id}>
                          {pos.title}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    placeholder="Mô tả công việc chi tiết"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu (mỗi dòng một yêu cầu)
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="input w-full"
                    rows={4}
                    placeholder="Yêu cầu 1&#10;Yêu cầu 2&#10;..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'open' | 'closed' | 'filled' })
                    }
                    className="input w-full"
                  >
                    <option value="open">Đang tuyển</option>
                    <option value="closed">Đã đóng</option>
                    <option value="filled">Đã đủ</option>
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
                  {saveMutation.isPending ? 'Đang lưu...' : selectedRecruitment ? 'Cập nhật' : 'Đăng'}
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

export default Recruitment;


