import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as authApi from '@/api/authApi';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});

  function validate(): boolean {
    const errors: { email?: string; password?: string; username?: string } = {};
    if (!email) {
      errors.email = '이메일을 입력해 주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }
    if (!password) {
      errors.password = '비밀번호를 입력해 주세요';
    } else if (password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다';
    }
    if (!username) {
      errors.username = '사용자 이름을 입력해 주세요';
    } else if (username.length < 2) {
      errors.username = '사용자 이름은 2자 이상이어야 합니다';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authApi.signup({ email, password, username });
      navigate(ROUTES.LOGIN);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          username: 'username이 이미 사용 중입니다',
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          username: '회원가입 중 오류가 발생했습니다',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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
          autoComplete="new-password"
          placeholder="8자 이상 입력하세요"
        />
        <Input
          label="사용자 이름"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
          autoComplete="username"
          placeholder="2자 이상 입력하세요"
        />
        <Button
          type="submit"
          variant="filled"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full mt-2"
        >
          회원가입
        </Button>
      </form>
      <p className="text-center text-[13px] text-neutral mt-2">
        이미 계정이 있으신가요?{' '}
        <a href={ROUTES.LOGIN} className="text-primary no-underline hover:underline">
          로그인
        </a>
      </p>
    </>
  );
}
