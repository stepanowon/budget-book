import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
} from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createGroupSchema, updateGroupSchema } from '../validators/group.schema';
import { sendInvitationSchema, respondInvitationSchema } from '../validators/invitation.schema';
import * as groupController from '../controllers/group.controller';
import categoryRouter from './category.routes';
import expenseRouter from './expense.routes';
import settlementRouter from './settlement.routes';
import reportRouter from './report.routes';

const router = Router();

// 그룹 CRUD
router.post('/', authenticate, validateBody(createGroupSchema), groupController.createGroup);
router.get('/', authenticate, groupController.getMyGroups);
router.get('/:groupId', authenticate, requireGroupMember, groupController.getGroupDetail);
router.patch(
  '/:groupId',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
  validateBody(updateGroupSchema),
  groupController.updateGroup,
);
router.delete(
  '/:groupId',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  groupController.deactivateGroup,
);

// 초대
router.post(
  '/:groupId/invitations',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
  validateBody(sendInvitationSchema),
  groupController.sendInvitation,
);
router.get(
  '/:groupId/invitations',
  authenticate,
  requireGroupMember,
  groupController.getGroupInvitations,
);

// 멤버 조회 / 제거
router.get(
  '/:groupId/members',
  authenticate,
  requireGroupMember,
  groupController.getGroupMembers,
);
router.delete(
  '/:groupId/members/:userId',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  requireActiveGroup,
  groupController.removeGroupMember,
);

// 카테고리 서브라우터
router.use('/:groupId/categories', categoryRouter);

// 지출 서브라우터
router.use('/:groupId/expenses', expenseRouter);

// 정산 서브라우터
router.use('/:groupId/settlements', settlementRouter);

// 리포트 서브라우터
router.use('/:groupId/reports', reportRouter);

export { respondInvitationSchema };
export default router;
