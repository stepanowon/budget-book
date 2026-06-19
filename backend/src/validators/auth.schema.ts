import { z } from 'zod';

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, '아이디는 3자 이상이어야 합니다.')
    .max(20, '아이디는 20자 이하여야 합니다.')
    .regex(/^[a-z0-9_]+$/, '아이디는 영문 소문자, 숫자, 밑줄만 허용됩니다.'),
  email: z.string().email('올바른 이메일 형식이어야 합니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/[A-Za-z]/, '비밀번호에 영문자가 포함되어야 합니다.')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다.')
    .regex(/[^A-Za-z0-9]/, '비밀번호에 특수문자가 포함되어야 합니다.'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  new_password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/[A-Za-z]/, '비밀번호에 영문자가 포함되어야 합니다.')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다.')
    .regex(/[^A-Za-z0-9]/, '비밀번호에 특수문자가 포함되어야 합니다.'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
