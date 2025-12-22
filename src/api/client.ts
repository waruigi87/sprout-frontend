import axios, { 
  type InternalAxiosRequestConfig,  // ★ここに type を追加
  type AxiosResponse,               // ★ここに type を追加
  AxiosError 
} from 'axios';

// 環境変数からAPIのURLを取得（なければローカルを見る）
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 【リクエスト時の処理】
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 【レスポンス時の処理】
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // 認証エラー時の処理
    }
    return Promise.reject(error);
  }
);

export default client;
