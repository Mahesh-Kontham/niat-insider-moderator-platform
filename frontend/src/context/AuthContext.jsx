import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  const fetchCurrentUser = async () => {
    try {
      const user = await authAPI.getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load user profile', err);
      // Clean up invalid session keys
      logoutState();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        await fetchCurrentUser();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [accessToken]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authAPI.login(credentials);
      // Retrieve profile immediately
      await fetchCurrentUser();
      return data;
    } catch (err) {
      logoutState();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutState = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
  };

  const logout = () => {
    logoutState();
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = {
    currentUser,
    accessToken,
    refreshToken,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!currentUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
