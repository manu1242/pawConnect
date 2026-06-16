import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://pawconnectbackend.onrender.com/api/v1";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to Inject Token
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync("pawconnect_access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error retrieving token from secure store", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to Handle Token Expired (AUTH_003) & Refreshing
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const responseData = error.response?.data as any;
    const errorCode = responseData?.code || responseData?.errorCode;

    // Check if unauthorized and matches AUTH_003 (Token Expired)
    if (status === 401 && (errorCode === "AUTH_003" || responseData?.message?.includes("expired")) && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        // Silent token refresh
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.success) {
          const newToken = refreshResponse.data?.data?.accessToken;
          await SecureStore.setItemAsync("pawconnect_access_token", newToken);
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken);

          processQueue(null, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Wipe auth credentials and force redirect to login
        await SecureStore.deleteItemAsync("pawconnect_access_token");
        useAuthStore.getState().clearAuth();
        router.replace("/login" as any);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Other 401s like invalid credentials, wipe and redirect
    if (status === 401) {
      await SecureStore.deleteItemAsync("pawconnect_access_token");
      useAuthStore.getState().clearAuth();
      router.replace("/login" as any);
    }

    return Promise.reject(error);
  }
);
