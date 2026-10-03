import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LandingPage from '@/pages/LandingPage';
import ApplyPage from '@/pages/ApplyPage';
import { AdminGuard } from '@/pages/admin/AdminAuth';

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminApplicationsPage = lazy(() => import('@/pages/admin/AdminApplicationsPage'));
const AdminApplicationDetailPage = lazy(
  () => import('@/pages/admin/AdminApplicationDetailPage'),
);
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminExportsPage = lazy(() => import('@/pages/admin/AdminExportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-mist-300">
      <Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden="true" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="applications/:docId" element={<AdminApplicationDetailPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="exports" element={<AdminExportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
