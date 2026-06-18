import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { respondInvitationSchema } from '../validators/invitation.schema';
import * as groupController from '../controllers/group.controller';

const router = Router();

// 수신 초대 수락/거절
router.patch(
  '/:invitationId/respond',
  authenticate,
  validateBody(respondInvitationSchema),
  groupController.respondToInvitation,
);

export default router;
