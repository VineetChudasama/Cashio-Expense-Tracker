import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

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

const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Forecast = React.lazy(() => import('./pages/Forecast'));
const Splits = React.lazy(() => import('./pages/Splits'));
const Insights = React.lazy(() => import('./pages/Insights'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-9 h-9 border-3 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <React.Suspense fallback={<PageLoader />}>
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
          </React.Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
