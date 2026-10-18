import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
} from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createSettlementSchema } from '../validators/settlement.schema';
import * as settlementController from '../controllers/settlement.controller';
import * as reportController from '../controllers/report.controller';

const router = Router({ mergeParams: true });

// 정산 실행 (MANAGER만)
router.post(
  '/',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
  validateBody(createSettlementSchema),
  settlementController.createSettlement,
);

// 정산 목록 조회
router.get('/', authenticate, requireGroupMember, settlementController.getSettlements);

// 정산 상세 조회
router.get(
  '/:settlementId',
  authenticate,
  requireGroupMember,
  settlementController.getSettlementDetail,
);

// 엑셀 내보내기
router.get(
  '/:settlementId/export',
  authenticate,
  requireGroupMember,
  reportController.exportSettlementExcel,
);

export default router;
