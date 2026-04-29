import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { AttackPage } from './components/AttackPage';
import { SiteHeader } from './components/SiteHeader';

export function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/attacks/:slug" element={<AttackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
