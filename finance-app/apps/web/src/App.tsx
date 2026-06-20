import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectionPage } from './pages/ProjectionPage';
import { TransactionsPage } from './pages/TransactionsPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/projection" element={<ProjectionPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Routes>
    </AppShell>
  );
}
