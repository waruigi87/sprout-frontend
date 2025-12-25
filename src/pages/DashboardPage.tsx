import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EarthCanvas } from '../components/3d/Earth';
import { 
  Thermometer, 
  Droplets, 
  TrendingUp, 
  CheckSquare,
  Award,
  BookOpen,
  X,
  AlertTriangle,
  LogOut,
  Lock,
  Medal,
  Trophy,
  Eye,
  RefreshCw
} from 'lucide-react';

// APIと型定義のインポート
import { dashboardApi, type DashboardResponse } from '../api/dashboardApi';
import { authApi } from '../api/authApi';

type ModalType = 'environment' | 'todo' | 'badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [openModals, setOpenModals] = useState<ModalType[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentClassId = Number(classId);

  // データ取得ロジック
  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const storedInfo = localStorage.getItem('userInfo');
      const token = localStorage.getItem('auth_token');
      
      const role = localStorage.getItem('user_role'); 
      setIsGuest(role === 'guest');

      if (!storedInfo || !token) throw new Error('ログイン情報が見つかりません');

      const userInfo = JSON.parse(storedInfo);
      
      if (userInfo.id !== currentClassId) {
         navigate(`/classes/${userInfo.id}/dashboard`, { replace: true });
         return;
      }

      const result = await dashboardApi.fetchDashboard(currentClassId);
      setData(result);

    } catch (err) {
      console.error(err);
      if (showLoading) setError('データの読み込みに失敗しました。');
      
      if (err instanceof Error && err.message === 'ログイン情報が見つかりません') {
         navigate('/login');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentClassId, navigate]);

  // 初回マウント時
  useEffect(() => {
    if (classId) {
      loadDashboard(true);
    }
  }, [classId, loadDashboard]);

  // 手動更新ボタン用の処理
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard(false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // ToDo更新ロジック
  const handleTodoToggle = async (todoId: number, currentStatus: boolean) => {
    if (!data || isGuest) return;

    const newStatus = !currentStatus;
    
    // Optimistic UI Update
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === todoId ? { ...todo, is_completed: newStatus } : todo
        )
      };
    });

    try {
      await dashboardApi.updateTodoStatus(currentClassId, todoId, newStatus);
    } catch (err) {
      console.error('ToDo update failed', err);
      alert('更新に失敗しました');
      loadDashboard(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか?')) return;

    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API failed', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('user_role');
      navigate('/login');
    }
  };

  // UIヘルパー
  const toggleModal = (modal: ModalType) => {
    setOpenModals(prev => 
      prev.includes(modal) 
        ? prev.filter(m => m !== modal)
        : [...prev, modal]
    );
  };

  const closeModal = (modal: ModalType) => {
    setOpenModals(prev => prev.filter(m => m !== modal));
  };

  const getBadgeIcon = (name: string) => {
    if (name.includes('初心者') || name.includes('Bronze')) return Medal;
    if (name.includes('博士') || name.includes('Gold') || name.includes('マスター')) return Trophy;
    return Award;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return '✓';
      case 'warning': return '!';
      case 'bad': return '✗';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'bad': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#5EA866] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#5EA866] flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-12 w-12 text-white mb-4" />
        <p className="text-white mb-4 font-bold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-white text-green-600 rounded-full font-bold shadow-lg"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!data) return null;

  const currentBed = data.beds[0] || {
    sensors: {
      temperature: { value: null, status: 'bad' },
      humidity: { value: null, status: 'bad' }
    }
  };
  const temperature = currentBed.sensors.temperature;
  const humidity = currentBed.sensors.humidity;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#5EA866]">
      {/* 左下のクラス情報 */}
      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 flex flex-col gap-2">
        {isGuest && (
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit shadow-md">
            <Eye size={12} />
            閲覧モード（ゲスト）
          </div>
        )}
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-3 md:p-4 flex items-center gap-2 md:gap-4 border border-white/50">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
              {data.class_name.charAt(0)}
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">クラス</p>
              <p className="text-base md:text-lg font-bold text-gray-800">{data.class_name}</p>
            </div>
          </div>
          <div className="w-px h-8 md:h-10 bg-gray-300"></div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="ログアウト"
          >
            <LogOut size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* 地球キャンバス */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] lg:w-[1000px] lg:h-[1000px]">
          <EarthCanvas />
        </div>
      </div>

      {/* ボタン配置 */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="relative w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px]">
          
          {/* 左上: 現在の環境 */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% - 200px)', left: 'calc(50% - 200px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('environment')} onMouseEnter={() => setHoveredButton('environment')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('environment') ? 'ring-4 ring-blue-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-blue-400/50'}`}>
                <Thermometer className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute top-full mt-2 sm:mt-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'environment' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <p className="text-xs sm:text-sm font-bold text-gray-800">現在の環境</p>
              </div>
            </button>
          </div>

          {/* 右上: 今日のToDo */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% - 200px)', left: 'calc(50% + 200px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('todo')} onMouseEnter={() => setHoveredButton('todo')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('todo') ? 'ring-4 ring-purple-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-purple-400/50'}`}>
                <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute top-full mt-2 sm:mt-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'todo' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <p className="text-xs sm:text-sm font-bold text-gray-800">今日のToDo</p>
              </div>
            </button>
          </div>

          {/* 左下: 獲得バッジ */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% + 200px)', left: 'calc(50% - 200px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('badge')} onMouseEnter={() => setHoveredButton('badge')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('badge') ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-yellow-400/50'}`}>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute bottom-full mb-2 sm:mb-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'badge' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-xs sm:text-sm font-bold text-gray-800">獲得バッジ</p>
              </div>
            </button>
          </div>

          {/* 右下: クイズ */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% + 200px)', left: 'calc(50% + 200px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => navigate(`/classes/${currentClassId}/learning`)} onMouseEnter={() => setHoveredButton('learning')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-green-400/50">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute bottom-full mb-2 sm:mb-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'learning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-xs sm:text-sm font-bold text-gray-800">クイズで学ぶ</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* モーダル: 現在の環境 (大きくしてレスポンシブ対応) */}
      {openModals.includes('environment') && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md lg:max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 lg:p-7 border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Thermometer className="w-6 h-6 lg:w-7 lg:h-7 text-blue-500" />
                現在の環境
              </h2>
              <button onClick={() => closeModal('environment')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 lg:p-5 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <Thermometer className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm lg:text-base text-gray-600">温度</p>
                      <p className="text-3xl lg:text-4xl font-bold text-gray-800">
                        {temperature.value !== null ? `${temperature.value.toFixed(1)}°C` : '--'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-3xl lg:text-4xl font-bold ${getStatusColor(temperature.status || 'good')}`}>
                    {getStatusIcon(temperature.status || 'good')}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 lg:p-5 border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Droplets className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm lg:text-base text-gray-600">湿度</p>
                      <p className="text-3xl lg:text-4xl font-bold text-gray-800">
                        {humidity.value !== null ? `${humidity.value.toFixed(1)}%` : '--'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-3xl lg:text-4xl font-bold ${getStatusColor(humidity.status || 'good')}`}>
                    {getStatusIcon(humidity.status || 'good')}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/classes/${currentClassId}/graphs`)} 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 lg:py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-base lg:text-lg"
              >
                <TrendingUp className="w-5 h-5" />
                グラフを見る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* モーダル: 今日のToDo (大きくしてレスポンシブ対応) */}
      {openModals.includes('todo') && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md lg:max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 lg:p-7 border border-purple-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 lg:w-7 lg:h-7 text-purple-500" />
                今日のToDo
              </h2>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`text-gray-400 hover:text-purple-500 transition-all ${isRefreshing ? 'animate-spin text-purple-500' : ''}`}
                  title="リストを更新"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button onClick={() => closeModal('todo')} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {isGuest && (
                <p className="text-sm text-yellow-600 bg-yellow-100 p-3 rounded-lg mb-2 text-center font-bold">
                  ※ ゲストはチェックを付けられません
                </p>
              )}
              {data.todos.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-base lg:text-lg">タスクはありません</p>
              ) : (
                data.todos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className={`flex items-center gap-3 p-3 lg:p-4 rounded-xl border transition-all duration-300 
                      ${todo.is_completed ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}
                      ${!isGuest && !todo.is_completed ? 'hover:bg-purple-100 cursor-pointer' : ''}
                    `}
                  >
                    <input 
                      type="checkbox" 
                      checked={todo.is_completed} 
                      onChange={() => handleTodoToggle(todo.id, todo.is_completed)} 
                      disabled={isGuest}
                      className={`w-5 h-5 lg:w-6 lg:h-6 rounded cursor-pointer
                        ${isGuest ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-purple-500 focus:ring-purple-400'}
                      `}
                    />
                    <span className={`flex-1 text-base lg:text-lg ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                      {todo.content}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* モーダル: 獲得バッジ (大きくしてレスポンシブ対応) */}
      {openModals.includes('badge') && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md lg:max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 lg:p-7 border border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-500" />
                獲得バッジ
              </h2>
              <button onClick={() => closeModal('badge')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {data.badges.length === 0 ? (
                <p className="col-span-2 md:col-span-3 text-center text-gray-500 py-8 text-base lg:text-lg">バッジデータがありません</p>
              ) : (
                data.badges.map((badge) => {
                  const BadgeIcon = getBadgeIcon(badge.name);
                  
                  return (
                    <div
                      key={badge.id}
                      className={`relative p-4 lg:p-5 rounded-xl border-2 transition-all duration-300 ${
                        badge.acquired
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`flex flex-col items-center gap-2 ${badge.acquired ? '' : 'opacity-50 grayscale'}`}>
                        <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center ${
                          badge.acquired 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg' 
                            : 'bg-gray-200'
                        }`}>
                          <BadgeIcon className={`w-8 h-8 lg:w-10 lg:h-10 ${badge.acquired ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <p className={`text-sm lg:text-base font-bold text-center ${badge.acquired ? 'text-gray-800' : 'text-gray-500'}`}>
                          {badge.name}
                        </p>
                        <div className={`absolute -top-2 -right-2 w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center shadow-lg ${
                          badge.acquired ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {badge.acquired ? (
                            <span className="text-white text-sm font-bold">✓</span>
                          ) : (
                            <Lock size={14} className="text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
