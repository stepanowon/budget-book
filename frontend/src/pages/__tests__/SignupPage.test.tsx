import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';
import * as authApi from '@/api/authApi';

vi.mock('@/api/authApi', () => ({
  signup: vi.fn(),
}));

async function fillAndSubmit(username: string, password = 'Passw0rd!') {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('이메일'), 'new@example.com');
  await user.type(screen.getByLabelText('비밀번호'), password);
  if (username) await user.type(screen.getByLabelText('사용자 이름'), username);
  await user.click(screen.getByRole('button', { name: '회원가입' }));
}

describe('SignupPage username·비밀번호 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['ab', '3자 이상'],
    ['UserName', '영문 소문자, 숫자, 밑줄(_)만'],
    ['홍길동입니다', '영문 소문자, 숫자, 밑줄(_)만'],
    ['a'.repeat(21), '20자 이하'],
    ['', '입력해 주세요'],
  ])('%j 는 오류를 표시하고 서버를 호출하지 않는다', async (username, message) => {
    await fillAndSubmit(username);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it.each([
    ['abcdefgh', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['abcdefg1', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['12345678!', '영문자, 숫자, 특수문자를 각각 1자 이상'],
    ['a1!', '8자 이상'],
  ])('비밀번호 %j 는 오류를 표시하고 서버를 호출하지 않는다', async (password, message) => {
    await fillAndSubmit('user_01', password);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it('유효한 username이면 가입 요청을 보낸다', async () => {
    vi.mocked(authApi.signup).mockResolvedValueOnce(undefined as never);
    await fillAndSubmit('user_01');
    expect(authApi.signup).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Passw0rd!',
      username: 'user_01',
    });
  });
});
