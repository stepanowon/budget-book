import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { respondInvitationSchema } from '../validators/invitation.schema';
import * as groupController from '../controllers/group.controller';

const router = Router();

// 내 수신 초대 목록 — /my 가 /:invitationId 보다 앞에 있어야 함
router.get('/my', authenticate, groupController.getMyInvitations);

// 수신 초대 수락/거절
router.patch(
  '/:invitationId',
  authenticate,
  validateBody(respondInvitationSchema),
  groupController.respondToInvitation,
);

export default router;
