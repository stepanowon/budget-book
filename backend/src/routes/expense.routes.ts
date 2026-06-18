import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireGroupMember } from '../middlewares/role.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from '../validators/expense.schema';
import * as expenseController from '../controllers/expense.controller';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authenticate,
  requireGroupMember,
  validateBody(createExpenseSchema),
  expenseController.createExpense,
);
router.get(
  '/',
  authenticate,
  requireGroupMember,
  validateQuery(expenseQuerySchema),
  expenseController.getExpenses,
);
router.get('/:expenseId', authenticate, requireGroupMember, expenseController.getExpenseDetail);
router.patch(
  '/:expenseId',
  authenticate,
  requireGroupMember,
  validateBody(updateExpenseSchema),
  expenseController.updateExpense,
);
router.delete('/:expenseId', authenticate, requireGroupMember, expenseController.deleteExpense);

export default router;
