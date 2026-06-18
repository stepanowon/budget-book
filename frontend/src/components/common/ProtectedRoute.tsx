import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '@/lib/tokenStore';
import { ROUTE_PATTERNS } from '@/constants/routes';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return (
      <Navigate
        to={ROUTE_PATTERNS.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
