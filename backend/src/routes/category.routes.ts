import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireGroupMember, requireGroupManager } from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createCategorySchema } from '../validators/category.schema';
import * as categoryController from '../controllers/category.controller';

const router = Router({ mergeParams: true });

router.get('/', authenticate, requireGroupMember, categoryController.getCategories);
router.post(
  '/',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  validateBody(createCategorySchema),
  categoryController.createGroupCategory,
);
router.delete(
  '/:categoryId',
  authenticate,
  requireGroupMember,
  requireGroupManager,
  categoryController.deleteCategory,
);

export default router;
