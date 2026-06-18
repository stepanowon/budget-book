import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';
import { HTTP_STATUS } from '../constants/errorCodes';

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoryService.getCategories(req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createGroupCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.createGroupCategory(
      req.params.groupId,
      req.body.name as string,
    );
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await categoryService.deleteCategory(req.params.categoryId, req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: '카테고리가 삭제되었습니다.' } });
  } catch (err) {
    next(err);
  }
}
