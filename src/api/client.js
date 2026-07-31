import axios from "axios";
import { normalizePhoneFields, validatePhoneFields } from "../utils/phone";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://saasbackend-production-9177.up.railway.app/api/v1";

export const api = axios.create({ baseURL: API_BASE });

let getSession = () => null;
let updateSession = () => {};
let clearSession = () => {};
let refreshPromise = null;

let sessionBlocked = false;

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
  const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/forgot-password") || url.includes("/auth/reset-password") || url.includes("/auth/refresh");
  if (sessionBlocked && !isAuthEndpoint) {
    return Promise.reject(Object.assign(new Error("Session expired"), { __sessionBlocked: true }));
  }

  const session = getSession?.();
  const accessToken = session?.accessToken;
  config.headers = config.headers || {};
  if (accessToken && !config.headers.Authorization && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    try {
      validatePhoneFields(config.data);
    } catch (phoneErr) {
      // Phone validation warning — do NOT block the request; backend validates authoritatively
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
    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const session = getSession?.();
    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
      sessionBlocked = true;
      clearSession?.();
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
      const nextRefreshToken = refreshResponse.data.refreshToken;
      sessionBlocked = false;
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
