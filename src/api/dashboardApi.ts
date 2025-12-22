import client from './client';

// --- 型定義 (Laravelからのレスポンスに合わせる) ---

export interface SensorStatus {
  value: number | null;
  status: 'good' | 'warning' | 'bad';
}

export interface Bed {
  id: number;
  name: string;
  status: string;
  crop_name: string | null;
  days_elapsed: number | null;
  sensors: {
    temperature: SensorStatus;
    humidity: SensorStatus;
  };
}

export interface TodoItem {
  id: number;
  content: string;
  is_completed: boolean;
}

export interface Badge {
  id: number;
  name: string;
  image_url: string | null; // ★修正: null許容に変更
  acquired: boolean;
}

export interface DashboardResponse {
  class_name: string;
  beds: Bed[];
  todos: TodoItem[];
  badges: Badge[];
}

export interface GraphDataPoint {
  recorded_at: string;
  temperature: number | null;
  humidity: number | null;
}

export interface GraphResponse {
  range: string;
  data: GraphDataPoint[];
}

// --- API呼び出し関数 ---

export const dashboardApi = {
  // ダッシュボード情報一括取得
  fetchDashboard: async (classId: number): Promise<DashboardResponse> => {
    const response = await client.get(`/classes/${classId}/dashboard`);
    return response.data;
  },

  // グラフデータ取得
  fetchGraphs: async (classId: number, range: '24h' | '7d' = '24h'): Promise<GraphResponse> => {
    const response = await client.get(`/classes/${classId}/graphs`, {
      params: { range },
    });
    return response.data;
  },

  // ToDoのチェック状態更新
  updateTodoStatus: async (classId: number, todoId: number, isCompleted: boolean): Promise<TodoItem> => {
    const response = await client.patch(`/classes/${classId}/todos/${todoId}`, {
      is_completed: isCompleted,
    });
    return response.data;
  },
};