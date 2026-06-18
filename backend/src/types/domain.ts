export type UserStatus = 'active' | 'inactive';
export type GroupType = 'LIMITED' | 'UNLIMITED';
export type GroupStatus = 'active' | 'inactive';
export type MemberRole = 'MANAGER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type CategoryScope = 'SYSTEM' | 'GROUP';
export type SplitType = 'EQUAL' | 'CUSTOM';

export interface UserPayload {
  id: string;
  username: string;
  status: UserStatus;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  status: UserStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  start_date: string;
  end_date: string | null;
  created_by: string;
  status: GroupStatus;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Invitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
}

export interface Category {
  id: string;
  name: string;
  scope: CategoryScope;
  group_id: string | null;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  category_id: string;
  total_amount: number;
  date: string;
  description: string | null;
  split_type: SplitType;
  created_by: string;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  period_start: string;
  period_end: string;
  created_by: string;
  created_at: string;
}

export interface SettlementDetail {
  id: string;
  settlement_id: string;
  user_id: string;
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
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}
