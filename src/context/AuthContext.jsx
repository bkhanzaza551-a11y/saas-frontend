/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
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
      const memberships = data.activeMemberships || (data.membership ? [data.membership] : []);
      const state = { ...data, memberships, salonId: data.membership?.salonId || null, rememberMe: payload.rememberMe };
      unblockSession();
      persistState(state, payload.rememberMe);
      try { localStorage.setItem("sidebarExpanded", "true"); } catch {}
    }
    return data;
  };

  const verifyOtp = async (payload, rememberMe = false) => {
    const { data } = await api.post("/auth/verify-otp", payload);
    const memberships = data.activeMemberships || (data.membership ? [data.membership] : []);
    const state = { ...data, memberships, salonId: data.membership?.salonId || null, rememberMe };
    unblockSession();
    persistState(state, rememberMe);
    try { localStorage.setItem("sidebarExpanded", "true"); } catch {}
    return data;
  };

  const switchSalon = async (salonId) => {
    const { data } = await api.post("/auth/switch-salon", { salonId });
    setAuth((current) => {
      if (!current) return current;
      const nextState = { ...current, accessToken: data.accessToken, membership: data.membership, memberships: data.activeMemberships || current.memberships, salonId: data.salonId ?? salonId };
      setToken(data.accessToken);
      writeAuth(nextState, current.rememberMe !== false);
      return nextState;
    });
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

  useEffect(() => {
    setAuthSessionHandlers({
      getCurrentSession: () => {
        return readAuth();
      },
      onRefreshSuccess: refreshSession,
      onAuthFailure: clearSession
    });
  }, []);

  useEffect(() => {
    if (!auth?.accessToken) return;
    let cancelled = false;
    api.get("/auth/me").then((res) => {
      if (cancelled || !res.data) return;
      const data = res.data;
      setAuth((current) => {
        if (!current) return current;
        const memberships = data.activeMemberships || (data.membership ? [data.membership] : []);
        const nextState = {
          ...current,
          user: data.user || current.user,
          membership: data.membership || current.membership,
          memberships: memberships.length ? memberships : current.memberships,
          salonId: data.membership?.salonId ?? current.salonId
        };
        writeAuth(nextState, current.rememberMe !== false);
        return nextState;
      });
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (auth?.accessToken && auth?.user?.systemRole !== "SUPER_ADMIN") {
      const currentSlug = auth?.membership?.salon?.slug || auth?.membership?.salonSlug;
      if (!currentSlug) {
        api.get("/owner/website/config").then((res) => {
          if (res.data?.slug) {
            setAuth((current) => {
              if (!current) return current;
              const nextMembership = {
                ...(current.membership || {}),
                salonSlug: res.data.slug,
                salon: {
                  ...(current.membership?.salon || {}),
                  id: current.membership?.salonId,
                  name: res.data.salonName || current.membership?.salonName,
                  slug: res.data.slug
                }
              };
              const nextState = { ...current, membership: nextMembership };
              writeAuth(nextState, current.rememberMe !== false);
              return nextState;
            });
          }
        }).catch(() => {});
      }
    }
  }, [auth?.accessToken, auth?.membership?.salonId]);

  const value = { auth, login, verifyOtp, resendOtp, logout, clearSession, switchSalon };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
