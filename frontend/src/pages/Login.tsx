import React, { useState, useEffect } from 'react';
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
  const { setAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginForm>();

  const demoAccounts = [
    { email: 'admin@hrm.com', password: 'admin123', role: 'Admin', gradient: 'from-purple-500 to-purple-600', bgGradient: 'from-purple-50 to-purple-100' },
    { email: 'hr@hrm.com', password: 'hr1234', role: 'HR', gradient: 'from-blue-500 to-blue-600', bgGradient: 'from-blue-50 to-blue-100' },
    { email: 'manager@hrm.com', password: 'manager123', role: 'Manager', gradient: 'from-amber-500 to-amber-600', bgGradient: 'from-amber-50 to-amber-100' },
    { email: 'employee@hrm.com', password: 'employee123', role: 'Employee', gradient: 'from-emerald-500 to-emerald-600', bgGradient: 'from-emerald-50 to-emerald-100' },
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <h1 className="text-3xl font-bold text-white">HRM</h1>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              HRM System
            </h1>
            <h2 className="text-lg font-semibold text-slate-600">Đăng nhập vào hệ thống</h2>
          </div>
          
          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 animate-slideUp">
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Demo Accounts */}
          <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">💡 Tài khoản demo:</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md bg-gradient-to-r ${account.bgGradient} border border-white/50`}
                >
                  <div className="font-bold text-slate-900">{account.role}</div>
                  <div className="text-slate-600 truncate">{account.email}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email là bắt buộc' })}
                className="input"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                {...register('password', { required: 'Mật khẩu là bắt buộc' })}
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-base py-3 font-semibold shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Click vào tài khoản demo để tự động điền thông tin
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
