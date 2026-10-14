import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConfettiProvider } from './components/Confetti';
import { useSettings } from './db/queries';
import { useApplyTheme } from './lib/theme';
import { Today } from './pages/Today';
import { CalendarPage } from './pages/Calendar';
import { Plan } from './pages/Plan';
import { SettingsPage } from './pages/Settings';
import { Dashboard } from './pages/Dashboard';

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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConfettiProvider>
  );
}
