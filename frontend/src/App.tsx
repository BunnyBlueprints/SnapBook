import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/common/Navbar';
import { PageLoader } from './components/common';
import './styles/globals.css';

const Home        = lazy(() => import('./pages/Home'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const AdminPage   = lazy(() => import('./pages/AdminPage'));
const LoginPage   = lazy(() => import('./pages/LoginPage'));

const AdminGuard: React.FC<{ el: React.ReactNode }> = ({ el }) => {
  const { auth } = useApp();
  return auth.isAuthenticated && auth.role === 'admin'
    ? <>{el}</> : <Navigate to="/login" replace />;
};

const Layout: React.FC = () => (
  <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
    <Navbar />
    <main style={{ flex: 1 }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/booking/:id" element={<BookingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/admin"       element={<AdminGuard el={<AdminPage />} />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
    <footer style={{
      borderTop:'1px solid var(--border)', padding:'1.5rem 0',
      background:'var(--bg2)', marginTop:'auto',
    }}>
      <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem' }}>
          🎟 <span style={{color:'var(--accent)'}}>Mod</span>ex
        </span>
        <span style={{ fontSize:'.75rem', color:'var(--ink3)', fontFamily:'monospace' }}>
          Node.js · Express · PostgreSQL · React · TypeScript
        </span>
        <span style={{ fontSize:'.78rem', color:'var(--ink3)' }}>
          © {new Date().getFullYear()} Modex Ticket Booking
        </span>
      </div>
    </footer>
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AppProvider>
      <Layout />
    </AppProvider>
  </BrowserRouter>
);

export default App;
