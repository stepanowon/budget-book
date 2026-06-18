import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as settlementController from '../controllers/settlement.controller';

const router = Router();

router.get('/', authenticate, settlementController.getMessages);

export default router;
