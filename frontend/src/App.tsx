import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ROUTE_PATTERNS, ROUTES } from '@/constants/routes';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/contexts/ToastContext';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';

import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import GroupListPage from '@/pages/groups/GroupListPage';
import GroupCreatePage from '@/pages/groups/GroupCreatePage';
import GroupDetailPage from '@/pages/groups/GroupDetailPage';
import InvitationsPage from '@/pages/groups/InvitationsPage';
import CategoryPage from '@/pages/groups/CategoryPage';
import ExpenseListPage from '@/pages/ExpenseListPage';
import ExpenseFormPage from '@/pages/ExpenseFormPage';
import SettlementPage from '@/pages/SettlementPage';
import MessageListPage from '@/pages/MessageListPage';
import ReportsPage from '@/pages/ReportsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import WithdrawPage from '@/pages/WithdrawPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Navigate to={ROUTES.GROUPS} replace />}
              />

              <Route element={<AuthLayout />}>
                <Route path={ROUTE_PATTERNS.LOGIN} element={<LoginPage />} />
                <Route path={ROUTE_PATTERNS.SIGNUP} element={<SignupPage />} />
              </Route>

              <Route
                path={ROUTE_PATTERNS.GROUPS}
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<GroupListPage />} />
                <Route path="new" element={<GroupCreatePage />} />
                <Route path=":groupId" element={<GroupDetailPage />}>
                  <Route path="expenses" element={<ExpenseListPage />} />
                  <Route path="expenses/new" element={<ExpenseFormPage />} />
                  <Route path="expenses/:expenseId/edit" element={<ExpenseFormPage />} />
                  <Route path="settlements" element={<SettlementPage />} />
                  <Route path="categories" element={<CategoryPage />} />
                </Route>
              </Route>

              <Route
                path={ROUTE_PATTERNS.INVITATIONS}
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<InvitationsPage />} />
              </Route>

              <Route
                path={ROUTE_PATTERNS.MESSAGES}
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MessageListPage />} />
              </Route>

              <Route
                path={ROUTE_PATTERNS.REPORTS}
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ReportsPage />} />
              </Route>

              <Route
                path={ROUTE_PATTERNS.SETTINGS_WITHDRAW}
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<WithdrawPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
