import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginForm>();

  const demoAccounts = [
    { email: 'admin@hrm.com', password: 'admin123', role: 'Admin', color: 'bg-purple-100 text-purple-800' },
    { email: 'hr@hrm.com', password: 'hr1234', role: 'HR', color: 'bg-blue-100 text-blue-800' },
    { email: 'manager@hrm.com', password: 'manager123', role: 'Manager', color: 'bg-orange-100 text-orange-800' },
    { email: 'employee@hrm.com', password: 'employee123', role: 'Employee', color: 'bg-green-100 text-green-800' },
  ];

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    reset({
      email: account.email,
      password: account.password,
    });
  };

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      setAuth(response.data.token, response.data.user);
      // Tất cả roles đều có thể vào "/" (Dashboard) - sẽ hiển thị nội dung phù hợp
      navigate('/');
    } catch (err: any) {
      // Hiển thị lỗi chi tiết hơn
      if (err.response) {
        // Server trả về lỗi
        const message = err.response.data?.message || 'Đăng nhập thất bại';
        setError(message);
      } else if (err.request) {
        // Request được gửi nhưng không có response (backend không chạy hoặc không thể kết nối)
        setError('Không thể kết nối tới server. Vui lòng kiểm tra backend có đang chạy không.');
      } else {
        // Lỗi khác
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 slide-up border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary-100 rounded-full mb-4 bounce-in">
            <h1 className="text-2xl font-bold text-primary-600">HRM</h1>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">HRM System</h1>
          <h2 className="text-xl font-semibold text-gray-700">Đăng nhập</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Demo Accounts */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Tài khoản demo:</p>
          <div className="space-y-2">
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                type="button"
                onClick={() => fillDemoAccount(account)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-80 ${account.color}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{account.role}:</span> {account.email}
                  </div>
                  <span className="text-xs opacity-75">Click để điền</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email là bắt buộc' })}
              className="input"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              {...register('password', { required: 'Mật khẩu là bắt buộc' })}
              className="input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Click vào tài khoản demo ở trên để tự động điền thông tin đăng nhập
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

