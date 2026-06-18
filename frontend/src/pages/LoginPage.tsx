import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AppError } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = '이메일을 입력해 주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }
    if (!password) {
      errors.password = '비밀번호를 입력해 주세요';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      await login(email, password);
      const state = location.state as LocationState | null;
      navigate(state?.from ?? ROUTES.GROUPS, { replace: true });
    } catch (err) {
      const appError = err as AppError;
      if (appError.status === 401) {
        setFormError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else {
        setFormError(appError.message ?? '로그인 중 오류가 발생했습니다');
      }
    }
  }

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="px-4 py-3 bg-danger-light border border-danger rounded text-[13px] text-danger" role="alert">
            {formError}
          </p>
        )}
        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="example@email.com"
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
        />
        <Button
          type="submit"
          variant="filled"
          size="md"
          loading={isLoading}
          disabled={isLoading}
          className="w-full mt-2"
        >
          로그인
        </Button>
      </form>
      <p className="text-center text-[13px] text-neutral mt-2">
        계정이 없으신가요?{' '}
        <a href={ROUTES.SIGNUP} className="text-primary no-underline hover:underline">
          회원가입
        </a>
      </p>
    </>
  );
}
