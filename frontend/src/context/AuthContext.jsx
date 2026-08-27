import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('flow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.data);
          } else {
            setToken(null);
            localStorage.removeItem('flow_token');
          }
        } catch (error) {
          setToken(null);
          localStorage.removeItem('flow_token');
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
    }
    return res;
  };

  const register = async (email, password, name) => {
    const res = await authApi.register({ email, password, name });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('flow_token', res.data.token);
    }
    return res;
  };

  const verifyRegisterOtp = async (email, code) => {
    const res = await authApi.verifyRegisterOtp({ email, code });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('flow_token', res.data.token);
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('flow_token');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyRegisterOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
