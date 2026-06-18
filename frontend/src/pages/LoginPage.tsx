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
      <style>{`
        .login-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .login-form__error {
          padding: var(--space-3) var(--space-4);
          background: var(--color-danger-light, #fce8e6);
          border: 1px solid var(--color-danger, #d93025);
          border-radius: var(--border-radius);
          font-size: 13px;
          color: var(--color-danger, #d93025);
        }
        .login-form__submit { width: 100%; margin-top: var(--space-2); }
        .login-form__footer {
          text-align: center;
          font-size: 13px;
          color: var(--color-neutral, #5f6368);
          margin-top: var(--space-2);
        }
        .login-form__footer a {
          color: var(--color-primary, #1a73e8);
          text-decoration: none;
        }
        .login-form__footer a:hover { text-decoration: underline; }
      `}</style>
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="login-form__error" role="alert">
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
          className="login-form__submit"
        >
          로그인
        </Button>
      </form>
      <p className="login-form__footer">
        계정이 없으신가요?{' '}
        <a href={ROUTES.SIGNUP}>회원가입</a>
      </p>
    </>
  );
}
