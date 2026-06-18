import type {
  User,
  GroupType,
  SplitType,
  Settlement,
  SettlementDetail,
  Message,
} from './domain';

// ─── 공통 응답 래퍼 ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ────────────────────────────────────────────────────────
export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

// ─── Groups ──────────────────────────────────────────────────────
export interface CreateGroupRequest {
  name: string;
  type: GroupType;
  start_date: string;
  end_date?: string | null;
}

export interface UpdateGroupRequest {
  name?: string;
  start_date?: string;
  end_date?: string | null;
}

export interface GroupResponse {
  id: string;
  name: string;
  type: 'LIMITED' | 'UNLIMITED';
  status: 'ACTIVE' | 'INACTIVE';
  start_date: string;
  end_date: string | null;
  created_at: string;
  my_role: 'MANAGER' | 'MEMBER';
  member_count: number;
}

// ─── Expenses ────────────────────────────────────────────────────
export interface CustomSplitItem {
  user_id: string;
  amount: number;
}

export interface CreateExpenseRequest {
  total_amount: number;
  category_id: string;
  date: string;
  description?: string | null;
  split_type: SplitType;
  participant_ids: string[];
  custom_splits?: CustomSplitItem[];
}

export interface UpdateExpenseRequest {
  total_amount?: number;
  category_id?: string;
  date?: string;
  description?: string | null;
  split_type?: SplitType;
  participant_ids?: string[];
  custom_splits?: CustomSplitItem[];
}

export interface ExpenseResponse {
  id: string;
  group_id: string;
  category_id: string;
  total_amount: number;
  date: string;
  description: string | null;
  paid_by: string;
  split_type: SplitType;
  splits: Array<{ id: string; user_id: string; amount: number }>;
  created_by: string;
  created_at: string;
}

export interface ExpenseListApiResponse {
  expenses: ExpenseResponse[];
  total: number;
  page: number;
  limit: number;
}

// ─── Settlements ─────────────────────────────────────────────────
export interface CreateSettlementRequest {
  period_start: string;
  period_end: string;
}

export interface SettlementResponse extends Settlement {}

export interface SettlementDetailResponse extends SettlementDetail {}

export interface SettlementCreateApiResponse {
  settlement: Settlement;
  details: SettlementDetail[];
}

// ─── Group Members ───────────────────────────────────────────────
export interface GroupMemberResponse {
  id: string;
  user_id: string;
  username: string;
  role: 'MANAGER' | 'MEMBER';
  joined_at: string;
}

// ─── Invitations ─────────────────────────────────────────────────
export interface SendInvitationRequest {
  invitee_username: string;
}

export interface RespondInvitationRequest {
  action: 'ACCEPT' | 'DECLINE';
}

export interface InvitationResponse {
  id: string;
  group_id: string;
  group_name: string;
  inviter_username: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

// ─── Messages ────────────────────────────────────────────────────
export interface MessageResponse extends Message {}

export interface MessageListApiResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

// ─── Categories ──────────────────────────────────────────────────
export interface CategoryResponse {
  id: string;
  name: string;
  type: 'SYSTEM' | 'GROUP';
  group_id: string | null;
}

// ─── Reports ─────────────────────────────────────────────────────
export interface ReportCategoryResponse {
  category_id: string;
  category_name: string;
  total: number;
}

export interface ReportMemberResponse {
  user_id: string;
  username: string;
  total_share: number;
}

// ─── User ────────────────────────────────────────────────────────
export interface UserResponse extends User {}
