import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('flow_token'));
  const [loading, setLoading] = useState(!user && Boolean(token));

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('flow_user', JSON.stringify(res.data));
            if (res.data?.avatar) {
              localStorage.setItem('flow_user_avatar', res.data.avatar);
            }
          } else {
            setToken(null);
            setUser(null);
            localStorage.removeItem('flow_token');
            localStorage.removeItem('flow_user');
            localStorage.removeItem('flow_user_avatar');
            localStorage.removeItem('flow_profile_cache');
          }
        } catch (error) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('flow_token');
          localStorage.removeItem('flow_user');
          localStorage.removeItem('flow_user_avatar');
          localStorage.removeItem('flow_profile_cache');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('flow_token', res.data.token);
      localStorage.setItem('flow_user', JSON.stringify(res.data.user));
      if (res.data.user?.avatar) {
        localStorage.setItem('flow_user_avatar', res.data.user.avatar);
      }
    }
    return res;
  };

  const register = async (email, password, name, currency = 'USD ($)', categoryLimits = {}) => {
    const res = await authApi.register({ email, password, name, currency, categoryLimits });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('flow_token', res.data.token);
      localStorage.setItem('flow_user', JSON.stringify(res.data.user));
      if (res.data.user?.avatar) {
        localStorage.setItem('flow_user_avatar', res.data.user.avatar);
      }
    }
    return res;
  };

  const verifyRegisterOtp = async (email, code) => {
    const res = await authApi.verifyRegisterOtp({ email, code });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('flow_token', res.data.token);
      localStorage.setItem('flow_user', JSON.stringify(res.data.user));
      if (res.data.user?.avatar) {
        localStorage.setItem('flow_user_avatar', res.data.user.avatar);
      }
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('flow_token');
    localStorage.removeItem('flow_user');
    localStorage.removeItem('flow_user_avatar');
    localStorage.removeItem('flow_profile_cache');
  };

  const updateUser = (userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('flow_user', JSON.stringify(updated));
      if (userData?.avatar !== undefined) {
        if (userData.avatar) {
          localStorage.setItem('flow_user_avatar', userData.avatar);
        } else {
          localStorage.removeItem('flow_user_avatar');
        }
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyRegisterOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
