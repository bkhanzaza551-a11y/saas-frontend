/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { api, setAuthSessionHandlers, setToken, unblockSession } from "../api/client";

const AuthCtx = createContext(null);
const STORAGE_KEY_PERSIST = "salonnest_auth";
const STORAGE_KEY_SESSION = "salonnest_auth_session";

const getStorageKey = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSIST);
    if (raw) return STORAGE_KEY_PERSIST;
  } catch {}
  return STORAGE_KEY_SESSION;
};

const readAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSIST) || 
                sessionStorage.getItem(STORAGE_KEY_SESSION) ||
                localStorage.getItem(STORAGE_KEY_SESSION); // Fallback for previous buggy version
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeAuth = (state, rememberMe) => {
  const key = rememberMe ? STORAGE_KEY_PERSIST : STORAGE_KEY_SESSION;
  const other = rememberMe ? STORAGE_KEY_SESSION : STORAGE_KEY_PERSIST;
  if (state) {
    if (rememberMe) {
      localStorage.setItem(key, JSON.stringify(state));
    } else {
      sessionStorage.setItem(key, JSON.stringify(state));
      try { localStorage.removeItem(key); } catch {} // Cleanup legacy bug
    }
  }
  try { sessionStorage.removeItem(other); } catch {}
  try { localStorage.removeItem(other); } catch {}
};

const removeAuth = () => {
  try { localStorage.removeItem(STORAGE_KEY_PERSIST); } catch {}
  try { sessionStorage.removeItem(STORAGE_KEY_SESSION); } catch {}
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const parsed = readAuth();
    if (parsed) {
      setToken(parsed.accessToken);
    }
    return parsed;
  });

  const persistState = (state, rememberMe = true) => {
    setAuth(state);
    if (state) {
      setToken(state.accessToken);
      writeAuth(state, rememberMe);
    } else {
      setToken(null);
      removeAuth();
    }
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    if (!data.requireOtp) {
      const state = { ...data, salonId: data.membership?.salonId || null, rememberMe: payload.rememberMe };
      unblockSession();
      persistState(state, payload.rememberMe);
    }
    return data;
  };

  const verifyOtp = async (payload, rememberMe = false) => {
    const { data } = await api.post("/auth/verify-otp", payload);
    const state = { ...data, salonId: data.membership?.salonId || null, rememberMe };
    unblockSession();
    persistState(state, rememberMe);
    return data;
  };

  const resendOtp = async (payload) => {
    const { data } = await api.post("/auth/resend-otp", payload);
    return data;
  };

  const refreshSession = (nextAccessToken, nextRefreshToken) => {
    setAuth((current) => {
      if (!current) return current;
      const nextState = { ...current, accessToken: nextAccessToken, ...(nextRefreshToken ? { refreshToken: nextRefreshToken } : {}) };
      setToken(nextAccessToken);
      writeAuth(nextState, current.rememberMe !== false);
      return nextState;
    });
  };

  const clearSession = () => {
    persistState(null);
  };

  const logout = async () => {
    try {
      if (auth?.refreshToken) {
        await api.post("/auth/logout", { refreshToken: auth.refreshToken });
      }
    } catch {
      // Ignore logout transport errors and still clear local session.
    }
    clearSession();
  };

  setAuthSessionHandlers({
    getCurrentSession: () => {
      return readAuth();
    },
    onRefreshSuccess: refreshSession,
    onAuthFailure: clearSession
  });

  const value = { auth, login, verifyOtp, resendOtp, logout, clearSession };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
