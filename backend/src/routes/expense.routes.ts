import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireGroupMember, requireActiveGroup } from '../middlewares/role.middleware';
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
  requireActiveGroup,
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
  requireActiveGroup,
  validateBody(updateExpenseSchema),
  expenseController.updateExpense,
);
router.delete(
  '/:expenseId',
  authenticate,
  requireGroupMember,
  requireActiveGroup,
  expenseController.deleteExpense,
);

export default router;
