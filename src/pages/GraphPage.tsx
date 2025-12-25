// src/pages/GraphPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { AxiosError } from 'axios';

// APIと型定義をインポート
import { dashboardApi, type GraphDataPoint } from '../api/dashboardApi';

// 現在の環境表示用の型
interface CurrentEnvironment {
  temperature: {
    value: number | null;
    status: 'good' | 'warning' | 'bad';
  };
  humidity: {
    value: number | null;
    status: 'good' | 'warning' | 'bad';
  };
}

type TabType = 'temperature' | 'humidity';

export const GraphPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const currentClassId = Number(classId);
  
  const [activeTab, setActiveTab] = useState<TabType>('temperature');
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [currentEnv, setCurrentEnv] = useState<CurrentEnvironment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // データを一括取得
  const fetchAllData = useCallback(async () => {
    if (!currentClassId) return;

    try {
      setLoading(true);

      // 1. グラフデータの取得
      const graphRes = await dashboardApi.fetchGraphs(currentClassId, '24h');
      
      // 現在時刻を取得
      const now = new Date();

      // ★修正ポイント: 取得したデータの日時に9時間を足す処理
      const adjustedData = graphRes.data.map(point => {
        const date = new Date(point.recorded_at);
        // イギリス時間(UTC)などから日本時間(JST)へ変換するために9時間加算
        date.setHours(date.getHours() + 9);
        
        return {
          ...point,
          // Rechartsで扱いやすいようにISO文字列に戻して保存
          recorded_at: date.toISOString()
        };
      });

      // 未来のデータを除外するフィルタリング処理
      // (9時間足した後の時間で判定します)
      const validGraphData = adjustedData.filter(point => {
        const recordDate = new Date(point.recorded_at);
        return recordDate <= now;
      });

      setGraphData(validGraphData);

      // 2. 現在の環境データの取得
      const dashRes = await dashboardApi.fetchDashboard(currentClassId);
      
      if (dashRes.beds.length > 0) {
        setCurrentEnv(dashRes.beds[0].sensors);
      }

    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
      
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [currentClassId, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 時刻フォーマット (X軸用: HH:MM)
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch { 
      return '--:--';
    }
  };

  // ツールチップ用の詳細日時フォーマット (MM/DD HH:MM)
  const formatTooltipDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const getChartConfig = () => {
    if (activeTab === 'temperature') {
      return {
        dataKey: 'temperature',
        stroke: '#ef4444',
        label: '温度 (°C)',
        unit: '°C',
        yAxisDomain: ['auto', 'auto'] as [number | string, number | string]
      };
    } else {
      return {
        dataKey: 'humidity',
        stroke: '#3b82f6',
        label: '湿度 (%)',
        unit: '%',
        yAxisDomain: [0, 100] as [number, number]
      };
    }
  };

  const chartConfig = getChartConfig();

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-800 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          再読み込み
        </button>
        <button
          onClick={() => navigate(`/classes/${currentClassId}/dashboard`)}
          className="mt-4 text-green-700 underline"
        >
          ダッシュボードへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-8">
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate(`/classes/${currentClassId}/dashboard`)}
          className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors mb-4"
        >
          <ArrowLeft size={24} />
          <span className="text-lg font-medium">ダッシュボードに戻る</span>
        </button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">
          環境グラフ
        </h1>
        <p className="text-green-600">過去24時間の推移</p>
      </div>

      {/* 現在の環境サマリ */}
      {currentEnv && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-center gap-4 text-2xl md:text-3xl font-bold text-gray-800">
              <span className="text-gray-700">現在の環境</span>
              
              {/* 温度 */}
              <span className="text-gray-600 ml-2">温度:</span>
              <span className={`${
                currentEnv.temperature.status === 'bad' ? 'text-red-500' : 
                currentEnv.temperature.status === 'warning' ? 'text-yellow-500' : 'text-gray-900'
              }`}>
                {currentEnv.temperature.value?.toFixed(1) ?? '--'}
              </span>
              <span className="text-gray-600">°C</span>

              {/* 湿度 */}
              <span className="text-gray-600 ml-4">湿度:</span>
              <span className={`${
                currentEnv.humidity.status === 'bad' ? 'text-red-500' : 
                currentEnv.humidity.status === 'warning' ? 'text-yellow-500' : 'text-gray-900'
              }`}>
                {currentEnv.humidity.value?.toFixed(0) ?? '--'}
              </span>
              <span className="text-gray-600">%</span>
            </div>
          </div>
        </div>
      )}

      {/* グラフエリア */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* タブ */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('temperature')}
              className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors ${
                activeTab === 'temperature'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              温度
            </button>
            <button
              onClick={() => setActiveTab('humidity')}
              className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors ${
                activeTab === 'humidity'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              湿度
            </button>
          </div>

          {/* グラフ */}
          <div className="p-6">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="recorded_at" 
                    tickFormatter={formatTime}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={chartConfig.yAxisDomain}
                    stroke="#6b7280"
                    style={{ fontSize: '14px' }}
                    label={{ 
                      value: chartConfig.label, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: '14px', fill: '#6b7280' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number | undefined) => {
                      if (value === undefined || value === null) return ['--', chartConfig.label];
                      return [`${Number(value).toFixed(1)} ${chartConfig.unit}`, chartConfig.label];
                    }}
                    // ★修正: ツールチップの日時も9時間足した状態で表示
                    labelFormatter={(label) => `日時: ${formatTooltipDate(label as string)}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#333'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={chartConfig.dataKey} 
                    stroke={chartConfig.stroke} 
                    strokeWidth={3}
                    dot={{ fill: chartConfig.stroke, r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                データがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};