import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CashioOrbitalLoader from './components/CashioOrbitalLoader';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Forecast from './pages/Forecast';
import Splits from './pages/Splits';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function AppContent() {
  const { loading: authLoading } = useAuth();

  // Exactly one persistent continuous loader during startup and authentication
  if (authLoading) {
    return <CashioOrbitalLoader size="fullscreen" text="Loading..." />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/splits" element={<Splits />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
