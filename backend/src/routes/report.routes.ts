import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireGroupMember } from '../middlewares/role.middleware';
import * as reportController from '../controllers/report.controller';

const router = Router({ mergeParams: true });

router.get('/categories', authenticate, requireGroupMember, reportController.getCategoryReport);
router.get('/members', authenticate, requireGroupMember, reportController.getMemberReport);
router.get(
  '/expenses/export',
  authenticate,
  requireGroupMember,
  reportController.exportExpensesExcel,
);
router.get(
  '/settlements/:settlementId/export',
  authenticate,
  requireGroupMember,
  reportController.exportSettlementExcel,
);

export default router;
