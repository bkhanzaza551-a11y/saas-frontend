import axios from "axios";
import { normalizePhoneFields, validatePhoneFields } from "../utils/phone";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://saasbackend-production-9177.up.railway.app/api/v1";

export const api = axios.create({ baseURL: API_BASE });

let getSession = () => null;
let updateSession = () => {};
let clearSession = () => {};
let refreshPromise = null;

let sessionBlocked = false;

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem("salonnest_auth") || 
                sessionStorage.getItem("salonnest_auth_session") ||
                localStorage.getItem("salonnest_auth_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const unblockSession = () => {
  sessionBlocked = false;
};

export const setToken = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export const setAuthSessionHandlers = ({ getCurrentSession, onRefreshSuccess, onAuthFailure }) => {
  getSession = getCurrentSession;
  updateSession = onRefreshSuccess;
  clearSession = onAuthFailure;
};

api.interceptors.request.use((config) => {
  const url = config.url || "";
  const isAuthEndpoint = url.startsWith("/auth/") || url.includes("/auth/") || url.startsWith("/public/") || url.includes("/public/");

  const session = getSession?.() || getStoredSession();
  const accessToken = session?.accessToken;
  config.headers = config.headers || {};
  if (accessToken && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    try {
      validatePhoneFields(config.data);
    } catch (phoneErr) {
      console.warn("[Phone Validation]", phoneErr.message);
    }
    config.data = normalizePhoneFields(config.data);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.__sessionBlocked) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.startsWith("/auth/") || url.includes("/auth/") || url.startsWith("/public/") || url.includes("/public/");

    if (!error.response || error.response.status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const session = getSession?.() || getStoredSession();
    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
      if (window.location.pathname !== "/login") {
        sessionBlocked = true;
        clearSession?.();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      }
      const refreshResponse = await refreshPromise;
      refreshPromise = null;
      const nextAccessToken = refreshResponse.data.accessToken;
      const nextRefreshToken = refreshResponse.data.refreshToken || refreshToken;
      sessionBlocked = false;
      setToken(nextAccessToken);
      updateSession?.(nextAccessToken, nextRefreshToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      sessionBlocked = true;
      clearSession?.();
      return Promise.reject(refreshError);
    }
  }
);
