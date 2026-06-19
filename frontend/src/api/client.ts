import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/tokenStore';
import { emitToast } from '@/lib/toastBus';
import { ERROR_MESSAGES } from '@/lib/errorMessages';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post<{
          success: boolean;
          data: { accessToken: string };
        }>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = response.data.data.accessToken;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return apiClient(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // 5xx 서버 에러
    if (error.response && error.response.status >= 500) {
      const code: string = (error.response.data as { errorCode?: string })?.errorCode ?? '';
      const msg = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
      emitToast(msg, 'error');
    }

    // 네트워크 오류 (응답 없음)
    if (!error.response && axios.isAxiosError(error)) {
      emitToast(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    }

    return Promise.reject(error);
  },
);

export { apiClient };
export default apiClient;
