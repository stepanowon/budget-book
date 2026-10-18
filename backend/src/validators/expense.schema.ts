import { z } from 'zod';
import { AMOUNT_MIN, AMOUNT_MAX } from '../constants/expense';

export const createExpenseSchema = z.object({
  category_id: z.string().uuid('유효한 카테고리 ID여야 합니다.'),
  total_amount: z
    .number()
    .int('금액은 정수여야 합니다.')
    .min(AMOUNT_MIN, `금액은 ${AMOUNT_MIN}원 이상이어야 합니다.`)
    .max(AMOUNT_MAX, `금액은 ${AMOUNT_MAX}원 이하여야 합니다.`),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
  description: z.string().max(200, '설명은 200자 이하여야 합니다.').nullable().optional(),
  split_type: z.enum(['EQUAL', 'CUSTOM']),
  participant_ids: z.array(z.string().uuid()).min(1, '참여자는 1명 이상이어야 합니다.'),
  custom_splits: z
    .array(z.object({ user_id: z.string().uuid(), amount: z.number().int().min(0) }))
    .optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
