import React, { useState, useEffect } from 'react';
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
  Medal,  // ★追加: ブロンズメダル用
  Trophy  // ★追加: ゴールドメダル用
} from 'lucide-react';

// APIと型定義のインポート
import { dashboardApi, type DashboardResponse } from '../api/dashboardApi';
import { authApi } from '../api/authApi';

type ModalType = 'environment' | 'todo' | 'badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  
  // APIデータ管理
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI状態管理
  const [openModals, setOpenModals] = useState<ModalType[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const currentClassId = Number(classId);

  // --- 1. データ取得ロジック ---
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const storedInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('auth_token');
        
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
        setError('データの読み込みに失敗しました。');
        if (err instanceof Error && err.message === 'ログイン情報が見つかりません') {
           navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      loadDashboard();
    }
  }, [classId, currentClassId, navigate]);

  // --- 2. ToDo更新ロジック ---
  const handleTodoToggle = async (todoId: number, currentStatus: boolean) => {
    if (!data) return;

    const newStatus = !currentStatus;
    
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
    }
  };

  // --- 3. ログアウト処理 ---
  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;

    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API failed', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userType');
      navigate('/login');
    }
  };

  // --- 4. UIヘルパー ---
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

  // ★追加: バッジ名に基づいてアイコンコンポーネントを返す関数
  const getBadgeIcon = (name: string) => {
    if (name.includes('初心者') || name.includes('Bronze')) {
      return Medal;
    }
    if (name.includes('博士') || name.includes('Gold') || name.includes('マスター')) {
      return Trophy;
    }
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

  // --- 5. レンダリング準備 ---
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
      {/* クラス情報 & ログアウト */}
      <div className="absolute bottom-8 left-8 z-20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 flex items-center gap-4 border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {data.class_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm text-gray-500">クラス</p>
            <p className="text-lg font-bold text-gray-800">{data.class_name}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-gray-300"></div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="ログアウト"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* 3D地球モデル */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-[1000px] h-[1000px]">
          <EarthCanvas />
        </div>
      </div>

      {/* ボタンコンテナ */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="relative w-[800px] h-[800px]">
          {/* 左上: 現在の環境 */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% - 283px)', left: 'calc(50% - 283px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('environment')} onMouseEnter={() => setHoveredButton('environment')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('environment') ? 'ring-4 ring-blue-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-blue-400/50'}`}>
                <Thermometer className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'environment' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <p className="text-sm font-bold text-gray-800">現在の環境</p>
              </div>
            </button>
          </div>

          {/* 右上: 今日のToDo */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% - 283px)', left: 'calc(50% + 283px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('todo')} onMouseEnter={() => setHoveredButton('todo')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('todo') ? 'ring-4 ring-purple-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-purple-400/50'}`}>
                <CheckSquare className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'todo' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <p className="text-sm font-bold text-gray-800">今日のToDo</p>
              </div>
            </button>
          </div>

          {/* 左下: 獲得バッジ */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% + 283px)', left: 'calc(50% - 283px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => toggleModal('badge')} onMouseEnter={() => setHoveredButton('badge')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className={`w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${openModals.includes('badge') ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-[#5EA866]' : 'hover:shadow-yellow-400/50'}`}>
                <Award className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'badge' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-sm font-bold text-gray-800">獲得バッジ</p>
              </div>
            </button>
          </div>

          {/* 右下: クイズで学ぶ */}
          <div className="absolute pointer-events-auto" style={{ top: 'calc(50% + 283px)', left: 'calc(50% + 283px)', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => navigate(`/classes/${currentClassId}/learning`)} onMouseEnter={() => setHoveredButton('learning')} onMouseLeave={() => setHoveredButton(null)} className="relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-green-400/50">
                <BookOpen className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${hoveredButton === 'learning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-sm font-bold text-gray-800">クイズで学ぶ</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* --- モーダルコンポーネント群 --- */}
      
      {/* 1. 現在の環境 */}
      {openModals.includes('environment') && (
        <div className="absolute top-8 left-8 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-blue-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-blue-500" />
              現在の環境
            </h2>
            <button onClick={() => closeModal('environment')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Thermometer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">温度</p>
                    <p className="text-xl font-bold text-gray-800">
                      {temperature.value !== null ? `${temperature.value.toFixed(1)}°C` : '--'}
                    </p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(temperature.status || 'good')}`}>
                  {getStatusIcon(temperature.status || 'good')}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-3 border border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">湿度</p>
                    <p className="text-xl font-bold text-gray-800">
                      {humidity.value !== null ? `${humidity.value.toFixed(1)}%` : '--'}
                    </p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(humidity.status || 'good')}`}>
                  {getStatusIcon(humidity.status || 'good')}
                </div>
              </div>
            </div>
            <button onClick={() => navigate(`/classes/${currentClassId}/graphs`)} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              グラフを見る
            </button>
          </div>
        </div>
      )}

      {/* 2. 今日のToDo */}
      {openModals.includes('todo') && (
        <div className="absolute top-8 right-8 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-purple-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-500" />
              今日のToDo
            </h2>
            <button onClick={() => closeModal('todo')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.todos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">タスクはありません</p>
            ) : (
              data.todos.map((todo) => (
                <div key={todo.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-300 ${todo.is_completed ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200 hover:bg-purple-100'}`}>
                  <input type="checkbox" checked={todo.is_completed} onChange={() => handleTodoToggle(todo.id, todo.is_completed)} className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400 cursor-pointer" />
                  <span className={`flex-1 text-sm ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                    {todo.content}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. 獲得バッジ */}
      {openModals.includes('badge') && (
        <div className="absolute bottom-8 left-8 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-yellow-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              獲得バッジ
            </h2>
            <button onClick={() => closeModal('badge')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.badges.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-4">バッジデータがありません</p>
            ) : (
              data.badges.map((badge) => {
                // ここでバッジ名に応じたアイコンを取得
                const BadgeIcon = getBadgeIcon(badge.name);
                
                return (
                  <div
                    key={badge.id}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                      badge.acquired
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`flex flex-col items-center gap-1.5 ${badge.acquired ? '' : 'opacity-50 grayscale'}`}>
                      
                      {/* アイコン円 */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        badge.acquired 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg' 
                          : 'bg-gray-200'
                      }`}>
                        {/* ★修正: APIからimage_urlが返ってきても、
                           ここではlucideアイコン(Medal/Trophy/Award)を優先して表示します
                        */}
                        <BadgeIcon className={`w-6 h-6 ${badge.acquired ? 'text-white' : 'text-gray-400'}`} />
                      </div>

                      <p className={`text-xs font-bold text-center ${badge.acquired ? 'text-gray-800' : 'text-gray-500'}`}>
                        {badge.name}
                      </p>
                      
                      {/* 右上のステータスアイコン (チェック or 鍵) */}
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                        badge.acquired ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {badge.acquired ? (
                          <span className="text-white text-xs font-bold">✓</span>
                        ) : (
                          <Lock size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* アニメーション用CSS */}
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