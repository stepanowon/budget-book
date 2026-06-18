import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import axios from 'axios';
import * as authApi from '@/api/authApi';
import { setAccessToken } from '@/lib/tokenStore';

// ─── AppError ────────────────────────────────────────────────────
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

// ─── Context 타입 ────────────────────────────────────────────────
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

// ─── Context 생성 ────────────────────────────────────────────────
import { createElement } from 'react';

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const accessToken = response.data.accessToken;
      setAccessToken(accessToken);

      // 토큰 페이로드에서 사용자 정보 파싱 (JWT payload는 base64url)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1])) as {
          sub: string;
          email: string;
          username: string;
        };
        setCurrentUser({
          id: payload.sub,
          email: payload.email,
          username: payload.username,
        });
      } catch {
        // 페이로드 파싱 실패 시 최소 정보만
        setCurrentUser({ id: '', email, username: '' });
      }
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
      // 서버 오류 무시하고 로컬 상태 초기화
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

// ─── Hook ────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
}
