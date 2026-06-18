export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  GROUPS: '/groups',
  GROUP_CREATE: '/groups/new',
  GROUP_DETAIL: (groupId: string) => `/groups/${groupId}`,
  GROUP_EXPENSES: (groupId: string) => `/groups/${groupId}/expenses`,
  GROUP_EXPENSE_NEW: (groupId: string) => `/groups/${groupId}/expenses/new`,
  GROUP_EXPENSE_EDIT: (groupId: string, expenseId: string) =>
    `/groups/${groupId}/expenses/${expenseId}/edit`,
  GROUP_SETTLEMENTS: (groupId: string) => `/groups/${groupId}/settlements`,
  GROUP_CATEGORIES: (groupId: string) => `/groups/${groupId}/categories`,
  INVITATIONS: '/invitations',
  MESSAGES: '/messages',
  REPORTS: '/reports',
  SETTINGS_WITHDRAW: '/settings/withdraw',
} as const;

export const ROUTE_PATTERNS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  GROUPS: '/groups',
  GROUP_CREATE: '/groups/new',
  GROUP_DETAIL: '/groups/:groupId',
  GROUP_EXPENSES: '/groups/:groupId/expenses',
  GROUP_EXPENSE_NEW: '/groups/:groupId/expenses/new',
  GROUP_EXPENSE_EDIT: '/groups/:groupId/expenses/:expenseId/edit',
  GROUP_SETTLEMENTS: '/groups/:groupId/settlements',
  GROUP_CATEGORIES: '/groups/:groupId/categories',
  INVITATIONS: '/invitations',
  MESSAGES: '/messages',
  REPORTS: '/reports',
  SETTINGS_WITHDRAW: '/settings/withdraw',
} as const;
