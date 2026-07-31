import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://salonnest-backend-production.up.railway.app/api/v1";
const STORAGE_KEY = "salonnest_customer_session";

export const customerApi = axios.create({ baseURL: API_BASE });

export const getCustomerSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

export const setCustomerSession = (session) => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    delete customerApi.defaults.headers.common.Authorization;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  customerApi.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
};

export const bootstrapCustomerSession = () => {
  const session = getCustomerSession();
  if (session?.accessToken) {
    customerApi.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
  }
  return session;
};

let refreshPromise = null;

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const session = getCustomerSession();
    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
      setCustomerSession(null);
      window.location.href = "/customer/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      }
      const refreshResponse = await refreshPromise;
      refreshPromise = null;
      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
      setCustomerSession({ ...session, accessToken, refreshToken: newRefreshToken || refreshToken });
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return customerApi(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      setCustomerSession(null);
      window.location.href = "/customer/login";
      return Promise.reject(refreshError);
    }
  }
);

bootstrapCustomerSession();
