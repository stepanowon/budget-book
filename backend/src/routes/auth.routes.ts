import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { signupSchema, loginSchema } from '../validators/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/signup', validateBody(signupSchema), authController.signup);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.delete('/withdraw', authenticate, authController.withdraw);

export default router;
