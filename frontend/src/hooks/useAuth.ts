import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';
import axios from 'axios';
import * as authApi from '@/api/authApi';
import { getAccessToken, setAccessToken } from '@/lib/tokenStore';

export interface AppError {
  code: string;
  message: string;
  status: number;
}

function toAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    if (status === 401) {
      return { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다', status };
    }
    if (status === 409) {
      return { code: 'CONFLICT', message: 'username이 이미 사용 중입니다', status };
    }
    return {
      code: 'API_ERROR',
      message: error.response?.data?.message ?? '요청 처리 중 오류가 발생했습니다',
      status,
    };
  }
  return { code: 'UNKNOWN', message: '알 수 없는 오류가 발생했습니다', status: 0 };
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokenToUser(token: string | null): CurrentUser | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as {
      id?: string;
      username?: string;
      exp?: number;
    };
    if (!payload.id || !payload.username) return null;
    // 만료된 토큰이면 null 반환
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      setAccessToken(null);
      return null;
    }
    return { id: payload.id, email: '', username: payload.username };
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // localStorage에 저장된 토큰으로 초기 상태를 동기적으로 복원
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    parseTokenToUser(getAccessToken()),
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const token = response.data.accessToken;
      setAccessToken(token);
      const user = parseTokenToUser(token);
      setCurrentUser(user ?? { id: '', email, username: '' });
    } catch (error) {
      throw toAppError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // 서버 오류 무시
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, []);

  const withdraw = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.withdraw();
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    login,
    logout,
    withdraw,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
}
