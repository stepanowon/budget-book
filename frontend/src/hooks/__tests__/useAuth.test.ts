import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/tokenStore';

// axios 전체 mock
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: actual.default.create,
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

// authApi mock
vi.mock('@/api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  withdraw: vi.fn(),
  signup: vi.fn(),
  refresh: vi.fn(),
}));

import * as authApi from '@/api/authApi';

// JWT 페이로드 생성 헬퍼 (서명 없는 더미)
function makeDummyToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // AuthProvider는 마운트 시 localStorage의 토큰으로 로그인 상태를 복원하므로 테스트 간 격리가 필요하다
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태: isAuthenticated=false, currentUser=null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('login 성공 시 isAuthenticated=true, accessToken 저장', async () => {
    // 서버가 발급하는 Access Token 페이로드: { id, username, status }
    const token = makeDummyToken({
      id: 'user-1',
      username: 'tester',
      status: 'active',
    });

    vi.mocked(authApi.login).mockResolvedValueOnce({
      success: true,
      data: { accessToken: token },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    // 토큰에는 이메일이 없으므로 currentUser.email은 빈 문자열이다
    expect(result.current.currentUser).toEqual({
      id: 'user-1',
      email: '',
      username: 'tester',
    });
    expect(getAccessToken()).toBe(token);
  });

  it('login 실패(401) 시 AppError 코드 UNAUTHORIZED 던짐', async () => {
    const axiosError = new axios.AxiosError(
      'Unauthorized',
      '401',
      undefined,
      undefined,
      { status: 401, data: {}, headers: {}, config: {} as Parameters<typeof axios.AxiosError>[2], statusText: 'Unauthorized' },
    );

    vi.mocked(authApi.login).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.login('bad@example.com', 'wrong');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toMatchObject({
      code: 'UNAUTHORIZED',
      message: '이메일 또는 비밀번호가 올바르지 않습니다',
      status: 401,
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout 성공 시 isAuthenticated=false, accessToken null', async () => {
    const token = makeDummyToken({
      id: 'user-1',
      username: 'tester',
      status: 'active',
    });

    vi.mocked(authApi.login).mockResolvedValueOnce({
      success: true,
      data: { accessToken: token },
    });
    vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('AuthProvider 없이 useAuth 호출 시 에러 던짐', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  });
});
