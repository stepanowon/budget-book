export const ROLE = { MANAGER: 'MANAGER', MEMBER: 'MEMBER' } as const;
export type Role = typeof ROLE[keyof typeof ROLE];
export const INVITATION_EXPIRE_DAYS = 7;
