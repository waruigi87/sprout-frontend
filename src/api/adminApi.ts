import client from './client';

// --- 型定義 ---

export interface AdminInfo {
  id: number;
  name: string;
  school_name: string;
}

export interface AdminClass {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminHydroBed {
  id: number;
  class_id: number;
  name: string;
  device_id: string;
  location: string;
  status: 'active' | 'inactive';
  class_name?: string;
  class?: {
    name: string;
  };
}

// --- API呼び出し関数 ---

// 管理者情報取得
export const fetchAdminInfo = async (): Promise<AdminInfo> => {
  // localStorageから取得
  const adminInfoStr = localStorage.getItem('adminInfo');
  
  if (adminInfoStr) {
    return JSON.parse(adminInfoStr);
  }

  // ここでAPI(/me)から取得する処理を追加することも可能ですが、
  // 現状はログイン時に保存された情報を信頼します。
  // もしデータがない場合は、呼び出し元でログアウトさせるなどの処理が必要です。
  throw new Error('管理者情報が見つかりません');
};

// クラス一覧取得
export const fetchClassList = async (): Promise<AdminClass[]> => {
  const response = await client.get('/admin/classes');
  return response.data;
};

// クラス作成
export const createClass = async (name: string): Promise<AdminClass> => {
  const response = await client.post('/admin/classes', { name });
  return response.data;
};

// クラス更新
export const updateClass = async (id: number, name: string): Promise<AdminClass> => {
  const response = await client.put(`/admin/classes/${id}`, { name });
  return response.data;
};

// クラス削除
export const deleteClass = async (id: number): Promise<void> => {
  await client.delete(`/admin/classes/${id}`);
};

// 栽培ベッド一覧取得
export const fetchHydroBedList = async (): Promise<AdminHydroBed[]> => {
  const response = await client.get('/admin/hydro_beds');
  return response.data;
};

// 栽培ベッド作成
export const createHydroBed = async (params: {
  class_id: number;
  name: string;
  device_id: string;
  location: string;
}): Promise<AdminHydroBed> => {
  const response = await client.post('/admin/hydro_beds', params);
  return response.data;
};

// 栽培ベッド更新
export const updateHydroBed = async (
  id: number,
  params: {
    class_id: number; // ★追加
    name: string;
    device_id: string;
    location: string;
    status: 'active' | 'inactive';
  }
): Promise<AdminHydroBed> => {
  const response = await client.put(`/admin/hydro_beds/${id}`, params);
  return response.data;
};

// 栽培ベッド削除
export const deleteHydroBed = async (id: number): Promise<void> => {
  await client.delete(`/admin/hydro_beds/${id}`);
};

// 後方互換性
export const adminApi = {
  fetchClasses: fetchClassList,
  createClass,
  deleteClass,
  fetchBeds: fetchHydroBedList,
  createBed: (classId: number, name: string, deviceId: string) =>
    createHydroBed({ class_id: classId, name, device_id: deviceId, location: '' }),
  deleteBed: deleteHydroBed,
};