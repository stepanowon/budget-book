import { Request, Response, NextFunction } from 'express';
import * as settlementService from '../services/settlement.service';
import { HTTP_STATUS } from '../constants/errorCodes';

export async function createSettlement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await settlementService.createSettlement({
      group_id: req.params.groupId,
      period_start: req.body.period_start,
      period_end: req.body.period_end,
      created_by: req.user!.id,
    });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getSettlements(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settlements = await settlementService.getSettlements(req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: settlements });
  } catch (err) {
    next(err);
  }
}

export async function getSettlementDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await settlementService.getSettlementDetail(
      req.params.settlementId,
      req.params.groupId,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const result = await settlementService.getMessages(req.user!.id, page, limit);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
