import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { ProjectionPage } from './pages/ProjectionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { UpcomingPage } from './pages/UpcomingPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path='/' element={<DashboardPage />} />
        <Route path='/analytics' element={<AnalyticsPage />} />
        <Route path='/projection' element={<ProjectionPage />} />
        <Route path='/upcoming' element={<UpcomingPage />} />
        <Route path='/transactions' element={<TransactionsPage />} />
        <Route path='/tools/import-assistant' element={<ImportPage />} />
      </Routes>
    </AppShell>
  );
}
