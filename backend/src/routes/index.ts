import { Router, Request, Response } from 'express';
import authRouter from './auth.routes';
import groupRouter from './group.routes';
import invitationRouter from './invitation.routes';
import messageRouter from './message.routes';
import { HealthData } from '../types/api';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const data: HealthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.status(200).json({ success: true, data });
});

router.use('/auth', authRouter);
router.use('/groups', groupRouter);
router.use('/invitations', invitationRouter);
router.use('/messages', messageRouter);

export default router;
