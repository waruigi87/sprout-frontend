import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  fetchAdminInfo,
  fetchClassList,
  createClass,
  updateClass,
  deleteClass,
  fetchHydroBedList,
  createHydroBed,
  updateHydroBed,
  deleteHydroBed,
} from '../api/adminApi';
import type { AdminInfo, AdminClass, AdminHydroBed } from '../api/adminApi';

type TabType = 'classes' | 'beds';

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // 管理者情報
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  // クラス一覧
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [classFormData, setClassFormData] = useState({ name: '' });

  // 栽培ベッド一覧
  const [beds, setBeds] = useState<AdminHydroBed[]>([]);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<AdminHydroBed | null>(null);
  const [bedFormData, setBedFormData] = useState({
    class_id: '',
    name: '',
    device_id: '',
    location: '',
    status: 'active' as 'active' | 'inactive',
  });

  // タブ管理
  const [activeTab, setActiveTab] = useState<TabType>('classes');

  // ローディング状態
  const [isLoading, setIsLoading] = useState(false);

  // 初期データ取得
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const info = await fetchAdminInfo();
        setAdminInfo(info);
      } catch (error) {
        console.error('管理者情報の取得に失敗:', error);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  // クラス一覧取得
  useEffect(() => {
    const loadClasses = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClassList();
        setClasses(data);
      } catch (error) {
        console.error('クラス一覧の取得に失敗:', error);
      }
      setIsLoading(false);
    };
    if (activeTab === 'classes') {
      loadClasses();
    }
  }, [activeTab]);

  // 栽培ベッド一覧取得
  useEffect(() => {
    const loadBeds = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHydroBedList();
        setBeds(data);
      } catch (error) {
        console.error('栽培ベッド一覧の取得に失敗:', error);
      }
      setIsLoading(false);
    };
    if (activeTab === 'beds') {
      loadBeds();
    }
  }, [activeTab]);

  // ログアウト
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('adminInfo');
    navigate('/login');
  };

  // ===========================
  // クラス管理
  // ===========================
  const openClassCreateModal = () => {
    setEditingClass(null);
    setClassFormData({ name: '' });
    setIsClassModalOpen(true);
  };

  const openClassEditModal = (cls: AdminClass) => {
    setEditingClass(cls);
    setClassFormData({ name: cls.name });
    setIsClassModalOpen(true);
  };

  const closeClassModal = () => {
    setIsClassModalOpen(false);
    setEditingClass(null);
    setClassFormData({ name: '' });
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingClass) {
        // 編集
        await updateClass(editingClass.id, classFormData.name);
        setClasses(prev =>
          prev.map(c => (c.id === editingClass.id ? { ...c, name: classFormData.name } : c))
        );
      } else {
        // 新規作成
        const newClass = await createClass(classFormData.name);
        setClasses(prev => [...prev, newClass]);
      }
      closeClassModal();
    } catch (error) {
      console.error('クラス作成・更新に失敗:', error);
      alert('クラス作成・更新に失敗しました。');
    }
    setIsLoading(false);
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('このクラスを削除してもよろしいですか?')) return;
    setIsLoading(true);
    try {
      await deleteClass(id);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('クラス削除に失敗:', error);
      alert('クラス削除に失敗しました。');
    }
    setIsLoading(false);
  };

  // ===========================
  // 栽培ベッド管理
  // ===========================
  const openBedCreateModal = () => {
    setEditingBed(null);
    setBedFormData({
      class_id: '',
      name: '',
      device_id: '',
      location: '',
      status: 'active',
    });
    setIsBedModalOpen(true);
  };

  const openBedEditModal = (bed: AdminHydroBed) => {
    setEditingBed(bed);
    setBedFormData({
      class_id: String(bed.class_id),
      name: bed.name,
      device_id: bed.device_id,
      location: bed.location,
      status: bed.status,
    });
    setIsBedModalOpen(true);
  };

  const closeBedModal = () => {
    setIsBedModalOpen(false);
    setEditingBed(null);
    setBedFormData({
      class_id: '',
      name: '',
      device_id: '',
      location: '',
      status: 'active',
    });
  };

  const handleBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingBed) {
        // 編集
        await updateHydroBed(editingBed.id, {
          class_id: Number(bedFormData.class_id), // ★追加: クラスIDも更新
          name: bedFormData.name,
          device_id: bedFormData.device_id,
          location: bedFormData.location,
          status: bedFormData.status,
        });
        setBeds(prev =>
          prev.map(b =>
            b.id === editingBed.id
              ? {
                  ...b,
                  class_id: Number(bedFormData.class_id), // ★追加: 表示更新
                  name: bedFormData.name,
                  device_id: bedFormData.device_id,
                  location: bedFormData.location,
                  status: bedFormData.status,
                }
              : b
          )
        );
      } else {
        // 新規作成
        const newBed = await createHydroBed({
          class_id: Number(bedFormData.class_id),
          name: bedFormData.name,
          device_id: bedFormData.device_id,
          location: bedFormData.location,
        });
        setBeds(prev => [...prev, newBed]);
      }
      closeBedModal();
    } catch (error) {
      console.error('栽培ベッド作成・更新に失敗:', error);
      alert('栽培ベッド作成・更新に失敗しました。');
    }
    setIsLoading(false);
  };

  const handleDeleteBed = async (id: number) => {
    if (!window.confirm('この栽培ベッドを削除してもよろしいですか?')) return;
    setIsLoading(true);
    try {
      await deleteHydroBed(id);
      setBeds(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('栽培ベッド削除に失敗:', error);
      alert('栽培ベッド削除に失敗しました。');
    }
    setIsLoading(false);
  };

  // ===========================
  // レンダリング
  // ===========================
  return (
    // ★緑の背景（グラデーション）
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <header className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">管理画面</h1>
              {adminInfo && (
                <div className="mt-2 text-gray-600">
                  <p className="text-lg">{adminInfo.name} 様</p>
                  <p className="text-sm text-gray-500">{adminInfo.school_name}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={20} />
              ログアウト
            </button>
          </div>
        </header>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-xl shadow-xl mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 text-lg font-semibold transition ${
                activeTab === 'classes'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-green-600'
              }`}
              onClick={() => setActiveTab('classes')}
            >
              クラス一覧
            </button>
            <button
              className={`flex-1 py-4 text-lg font-semibold transition ${
                activeTab === 'beds'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-green-600'
              }`}
              onClick={() => setActiveTab('beds')}
            >
              栽培ベッド管理
            </button>
          </div>

          {/* コンテンツエリア */}
          <div className="p-6">
            {isLoading && (
              <div className="text-center text-gray-600 py-8">読み込み中...</div>
            )}

            {/* クラス一覧タブ */}
            {activeTab === 'classes' && !isLoading && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">クラス一覧</h2>
                  <button
                    onClick={openClassCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus size={20} />
                    新規作成
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">クラス名</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">コード</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls, idx) => (
                        <tr key={cls.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 text-sm text-gray-700">{cls.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{cls.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{cls.code}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openClassEditModal(cls)}
                              className="text-blue-600 hover:text-blue-800 mr-4"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 栽培ベッド管理タブ */}
            {activeTab === 'beds' && !isLoading && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">栽培ベッド一覧</h2>
                  <button
                    onClick={openBedCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus size={20} />
                    新規作成
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ベッド名</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">クラスID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">デバイスID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">設置場所</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">状態</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beds.map((bed, idx) => (
                        <tr key={bed.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 text-sm text-gray-700">{bed.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{bed.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{bed.class_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{bed.device_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{bed.location}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                bed.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {bed.status === 'active' ? '稼働中' : '停止中'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openBedEditModal(bed)}
                              className="text-blue-600 hover:text-blue-800 mr-4"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBed(bed.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===========================
          クラス作成・編集モーダル
      =========================== */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingClass ? 'クラス編集' : 'クラス新規作成'}
              </h2>
              <button onClick={closeClassModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleClassSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  クラス名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classFormData.name}
                  onChange={e => setClassFormData({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 3年A組"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeClassModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {editingClass ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          栽培ベッド作成・編集モーダル
      =========================== */}
      {isBedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingBed ? '栽培ベッド編集' : '栽培ベッド新規作成'}
              </h2>
              <button onClick={closeBedModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBedSubmit}>
              {/* クラスID (★修正: 条件分岐を削除し、編集時も選択可能に) */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  クラスID <span className="text-red-500">*</span>
                </label>
                <select
                  value={bedFormData.class_id}
                  onChange={e => setBedFormData({ ...bedFormData, class_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">選択してください</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (ID: {cls.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* ベッド名 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ベッド名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bedFormData.name}
                  onChange={e => setBedFormData({ ...bedFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: ベッド1"
                  required
                />
              </div>

              {/* デバイスID */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  デバイスID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bedFormData.device_id}
                  onChange={e => setBedFormData({ ...bedFormData, device_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: SB-XXXX"
                  required
                />
              </div>

              {/* 設置場所 (★修正: 条件分岐を削除し、編集時も表示) */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  設置場所 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bedFormData.location}
                  onChange={e => setBedFormData({ ...bedFormData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 教室A"
                  required
                />
              </div>

              {/* 状態 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  状態 <span className="text-red-500">*</span>
                </label>
                <select
                  value={bedFormData.status}
                  onChange={e =>
                    setBedFormData({
                      ...bedFormData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="active">稼働中</option>
                  <option value="inactive">停止中</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeBedModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {editingBed ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};