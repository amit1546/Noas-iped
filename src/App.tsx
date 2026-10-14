import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConfettiProvider } from './components/Confetti';
import { useSettings } from './db/queries';
import { useApplyTheme } from './lib/theme';
import { Today } from './pages/Today';
import { CalendarPage } from './pages/Calendar';
import { Plan } from './pages/Plan';
import { Nutrition } from './pages/Nutrition';
import { SettingsPage } from './pages/Settings';

// Charts are heavy; load them only when the dashboard is opened.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));

export default function App() {
  const settings = useSettings();
  useApplyTheme(settings.theme);
  return (
    <ConfettiProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="*" element={<Today />} />
            <Route path="plan" element={<Plan />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route
              path="dashboard"
              element={
                <Suspense fallback={null}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConfettiProvider>
  );
}
