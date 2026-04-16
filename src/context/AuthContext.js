// AuthContext.js — Global auth state for TeamFinder
// Place this file at: src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On app launch: check if a valid token is already stored ───────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await tokenStorage.getAccess();
        if (token) {
          const me = await api.getMe();
          setUser(me);
        }
      } catch (_) {
        await tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    // api.login returns { access, refresh } and saves to AsyncStorage
    const tokens = await api.login(username, password);

    // Fetch profile by passing the token directly — avoids AsyncStorage timing issues
    const me = await api.getMeWithToken(tokens.access);
    setUser(me);
    return me;
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (payload) => {
    const data = await api.register(payload);
    // Register already returns the user object — no need to fetch again
    setUser(data.user);
    return data;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  // ── Refresh user profile ───────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
