import apiClient from '@/api/client';
import type { SignupRequest, LoginRequest, LoginResponse } from '@/types/api';

export async function signup(data: SignupRequest): Promise<void> {
  await apiClient.post('/auth/signup', data);
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function refresh(): Promise<{ accessToken: string }> {
  const response = await apiClient.post<{ accessToken: string }>(
    '/auth/refresh',
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function withdraw(): Promise<void> {
  await apiClient.delete('/auth/withdraw');
}
