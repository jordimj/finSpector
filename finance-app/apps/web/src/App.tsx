import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </AppShell>
  );
}
