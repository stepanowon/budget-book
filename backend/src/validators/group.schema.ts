import { z } from 'zod';

export const createGroupSchema = z
  .object({
    name: z.string().min(1, '그룹명을 입력해주세요.').max(50, '그룹명은 50자 이하여야 합니다.'),
    type: z.enum(['LIMITED', 'UNLIMITED']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'LIMITED') {
      if (!data.end_date) {
        ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'LIMITED 타입은 종료일이 필수입니다.' });
      } else if (data.end_date < data.start_date) {
        ctx.addIssue({ code: 'custom', path: ['end_date'], message: '종료일은 시작일 이후여야 합니다.' });
      }
    }
  });

export const updateGroupSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .optional();

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
