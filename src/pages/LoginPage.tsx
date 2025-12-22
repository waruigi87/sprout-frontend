import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AxiosError } from 'axios';

type LoginMode = 'class' | 'admin';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('class');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    classCode: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'class') {
        // --- クラスコードログイン ---
        const data = await authApi.login(formData.classCode);

        localStorage.setItem('auth_token', data.token); 
        localStorage.setItem('userType', 'class');
        
        // クラス情報は userInfo として保存（Dashboardで使用）
        localStorage.setItem('userInfo', JSON.stringify(data.class));
        
        navigate(`/classes/${data.class.id}/dashboard`);

      } else {
        // --- 管理者ログイン ---
        const data = await authApi.adminLogin(formData.email, formData.password);

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('userType', 'admin');
        
        // ▼▼▼ 修正: adminApiに合わせて 'adminInfo' というキーで保存します ▼▼▼
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        
        navigate('/admin');
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data as { message?: string };
        setError(data.message || 'ログインに失敗しました。入力内容を確認してください。');
      } else {
        setError('ネットワークエラーが発生しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const switchMode = () => {
    setMode(prev => prev === 'class' ? 'admin' : 'class');
    setError('');
    setFormData({ classCode: '', email: '', password: '' });
  };

  // --- UI部分は変更なし ---
  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center overflow-hidden">
      <form 
        onSubmit={handleSubmit} 
        className="sm:w-[400px] w-full mx-4 text-center border border-gray-300/60 rounded-2xl px-8 py-10 bg-white shadow-xl"
      >
        {mode === 'class' ? (
          <>
            <h1 className="text-gray-900 text-2xl font-bold mb-2">
              クラスコードを入力しよう！
            </h1>
            
            <div className="mt-6 mb-4">
              <input
                type="text"
                name="classCode"
                placeholder="クラスコードを入力"
                className="w-full h-14 px-4 border-2 border-gray-300 rounded-lg text-lg outline-none focus:border-green-500 transition-colors"
                value={formData.classCode}
                onChange={handleChange}
                maxLength={20}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">バリデーションエラー</p>
                <p className="text-red-500 text-xs mt-1">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-full text-white text-lg font-bold transition-colors shadow-md ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'ログイン中...' : 'Enter'}
            </button>

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
              className="mt-4 text-sm text-indigo-600 hover:underline disabled:text-gray-400"
            >
              私は管理者です
            </button>
          </>
        ) : (
          <>
            <h1 className="text-gray-900 text-3xl font-medium mb-2">Login</h1>
            <p className="text-gray-500 text-sm mb-6">Please sign in to continue</p>

            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2 mb-4">
              <Mail size={16} className="text-gray-500" />
              <input
                type="email"
                name="email"
                placeholder="Email id"
                className="flex-1 border-none outline-none bg-transparent"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2 mb-2">
              <Lock size={16} className="text-gray-500" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="flex-1 border-none outline-none bg-transparent"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <p className="text-red-600 text-sm text-left">{error}</p>
              </div>
            )}

            <div className="text-left mb-4">
              <button 
                type="button" 
                className="text-sm text-indigo-500 hover:underline disabled:text-gray-400"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-full text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {loading ? 'ログイン中...' : 'Login'}
            </button>

            <p className="text-gray-500 text-sm mt-4">
              クラスコードでログインする場合は{' '}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="text-indigo-500 hover:underline disabled:text-gray-400"
              >
                こちら
              </button>
            </p>
          </>
        )}
      </form>
    </div>
  );
};