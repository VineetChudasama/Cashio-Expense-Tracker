import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import CashioOrbitalLoader from './CashioOrbitalLoader';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CashioOrbitalLoader size="fullscreen" text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
