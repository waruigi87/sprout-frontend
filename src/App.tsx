import { Layout } from './components/common/Layout';
import { LoadingScene } from './components/screen/LoadingScene';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GraphPage } from './pages/GraphPage';
import { LearningPage } from './pages/LearningPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* ▼ URLパラメータ (:classId) を受け取るように変更 */}
          <Route path="/classes/:classId/dashboard" element={<DashboardPage />} />
          
          {/* グラフ・学習ページも同様にIDを受け取る */}
          <Route path="/classes/:classId/graphs" element={<GraphPage/>} />
          <Route path="/classes/:classId/learning" element={<LearningPage/>} />
          
          <Route path="/loading" element={<LoadingScene />} />
          
          {/* 管理者用ルート */}
          <Route path="/admin" element={<AdminSettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;