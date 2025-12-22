import client from './client';

// レスポンスの型定義 (Laravelの返却値に合わせる)
export interface ClassLoginResponse {
  token: string;
  class: {
    id: number;
    name: string;
    locale: string;
  };
}

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: number;
    name: string;
    school_name: string;
  };
}

export const authApi = {
  // クラスログイン (POST /api/v1/login)
  login: async (code: string): Promise<ClassLoginResponse> => {
    const response = await client.post('/login', { code });
    return response.data;
  },

  // 管理者ログイン (POST /api/v1/admin/login)
  adminLogin: async (email: string, password: string): Promise<AdminLoginResponse> => {
    const response = await client.post('/admin/login', { email, password });
    return response.data;
  },

  // ログアウト (POST /api/v1/logout)
  logout: async () => {
    return client.post('/logout');
  }
};