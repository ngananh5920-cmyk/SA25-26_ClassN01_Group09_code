import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>();

  const newPassword = watch('newPassword');

  const onSubmitPassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
      return;
    }

    try {
      // Note: This endpoint needs to be implemented in the backend
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showToast('Đổi mật khẩu thành công', 'success');
      reset();
      setIsChangingPassword(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin tài khoản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{user?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 capitalize">
                {user?.role}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {user?.employeeId || 'Không có'}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Đổi mật khẩu</h2>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="btn btn-primary text-sm"
              >
                Đổi mật khẩu
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  {...register('currentPassword', { required: 'Mật khẩu hiện tại là bắt buộc' })}
                  className="input"
                />
                {errors.currentPassword && (
                  <p className="text-red-600 text-xs mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  {...register('newPassword', {
                    required: 'Mật khẩu mới là bắt buộc',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                  className="input"
                />
                {errors.newPassword && (
                  <p className="text-red-600 text-xs mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Xác nhận mật khẩu là bắt buộc',
                    validate: (value) =>
                      value === newPassword || 'Mật khẩu xác nhận không khớp',
                  })}
                  className="input"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          )}

          {!isChangingPassword && (
            <p className="text-sm text-gray-500 mt-4">
              Nhấn "Đổi mật khẩu" để thay đổi mật khẩu của bạn.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;


