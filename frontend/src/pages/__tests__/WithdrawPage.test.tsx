import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import WithdrawPage from '../WithdrawPage';
import * as authApi from '@/api/authApi';

vi.mock('@/api/authApi', () => ({
  changePassword: vi.fn(),
}));

const showToast = vi.fn();
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ withdraw: vi.fn(), currentUser: { id: 'u1', username: 'tester', email: '' } }),
}));

async function submit(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WithdrawPage />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('현재 비밀번호'), current);
  if (next) await user.type(screen.getByLabelText('새 비밀번호', { exact: true }), next);
  if (confirm) await user.type(screen.getByLabelText('새 비밀번호 확인'), confirm);
  await user.click(screen.getByRole('button', { name: '변경하기' }));
}

describe('WithdrawPage 비밀번호 변경 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['abcdefgh', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['abcdefg1', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['12345678!', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['a1!', '8자 이상'],
    ['', '입력해 주세요'],
  ])('새 비밀번호 %j 는 오류를 표시하고 서버를 호출하지 않는다', async (next, message) => {
    await submit('Current1!', next, next);
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('새 비밀번호 확인이 다르면 오류를 표시한다', async () => {
    await submit('Current1!', 'Passw0rd!', 'Passw0rd?');
    expect(screen.getByText('새 비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('규칙을 만족하면 변경 요청을 보낸다', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValueOnce(undefined as never);
    await submit('Current1!', 'Passw0rd!', 'Passw0rd!');
    expect(authApi.changePassword).toHaveBeenCalledWith({
      current_password: 'Current1!',
      new_password: 'Passw0rd!',
    });
  });

  it('서버가 거절하면 서버 메시지를 토스트로 표시한다 (현재 비밀번호 불일치)', async () => {
    const error = new AxiosError('Request failed with status code 401', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
      data: { success: false, errorCode: 'UNAUTHENTICATED', message: '현재 비밀번호가 올바르지 않습니다.' },
    });
    vi.mocked(authApi.changePassword).mockRejectedValueOnce(error);
    await submit('Wrong1234!', 'Passw0rd!', 'Passw0rd!');
    await screen.findByRole('button', { name: '변경하기' });
    expect(showToast).toHaveBeenCalledWith('현재 비밀번호가 올바르지 않습니다.', 'error');
  });

  it('응답이 없는 오류는 일반 안내 문구를 표시한다', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValueOnce(new Error('Network Error'));
    await submit('Current1!', 'Passw0rd!', 'Passw0rd!');
    await screen.findByRole('button', { name: '변경하기' });
    expect(showToast).toHaveBeenCalledWith('비밀번호 변경 중 오류가 발생했습니다.', 'error');
  });
});
