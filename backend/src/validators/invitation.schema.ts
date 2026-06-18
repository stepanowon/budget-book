import { z } from 'zod';

export const sendInvitationSchema = z.object({
  invitee_username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, '유효한 username이어야 합니다.'),
});

export const respondInvitationSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
