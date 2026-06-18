import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
  })
  .refine((data) => data.period_start <= data.period_end, {
    message: '정산 시작일은 종료일 이전이어야 합니다.',
    path: ['period_start'],
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
