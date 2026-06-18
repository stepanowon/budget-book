import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, '카테고리 이름을 입력해주세요.').max(20, '카테고리 이름은 20자 이하여야 합니다.'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
