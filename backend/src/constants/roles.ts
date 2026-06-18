export const ROLE = {
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;

export type InvitationStatusConst = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];
