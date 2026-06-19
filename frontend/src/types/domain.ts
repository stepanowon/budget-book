// ─── 열거형 상수 ────────────────────────────────────────────────
export const ROLE = {
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const SPLIT_TYPE = {
  EQUAL: 'EQUAL',
  CUSTOM: 'CUSTOM',
} as const;
export type SplitType = (typeof SPLIT_TYPE)[keyof typeof SPLIT_TYPE];

export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;
export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export const GROUP_TYPE = {
  LIMITED: 'LIMITED',
  UNLIMITED: 'UNLIMITED',
} as const;
export type GroupType = (typeof GROUP_TYPE)[keyof typeof GROUP_TYPE];

export const GROUP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
export type GroupStatus = (typeof GROUP_STATUS)[keyof typeof GROUP_STATUS];

export const CATEGORY_TYPE = {
  SYSTEM: 'SYSTEM',
  GROUP: 'GROUP',
} as const;
export type CategoryType = (typeof CATEGORY_TYPE)[keyof typeof CATEGORY_TYPE];

// ─── 도메인 엔티티 ───────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  status: GroupStatus;
  start_date: string;
  end_date: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  role: Role;
  joined_at: string;
}

export interface Invitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  scope: CategoryType;
  group_id: string | null;
}

export interface ExpenseSplit {
  id: string;
  user_id: string;
  amount: number;
}

export interface Expense {
  id: string;
  group_id: string;
  category_id: string;
  total_amount: number;
  date: string;
  description: string | null;
  paid_by: string;
  split_type: SplitType;
  splits: ExpenseSplit[];
  created_by: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  period_start: string;
  period_end: string;
  created_by: string;
  settled_at: string;
}

export interface SettlementDetail {
  id: string;
  settlement_id: string;
  user_id: string;
  username: string;
  total_paid: number;
  total_share: number;
  balance: number;
}

export interface Message {
  id: string;
  settlement_id: string;
  recipient_user_id: string;
  content: string;
  sent_at: string;
  period_start: string;
  period_end: string;
}
