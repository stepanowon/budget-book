import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import { HTTP_STATUS } from '../constants/errorCodes';
import { CreateExpenseInput, UpdateExpenseInput } from '../validators/expense.schema';

export async function createExpense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as CreateExpenseInput;
    const expense = await expenseService.createExpense(req.user!.id, {
      group_id: req.params.groupId,
      category_id: body.category_id,
      paid_by: body.paid_by ?? req.user!.id,
      total_amount: body.total_amount,
      split_type: body.split_type,
      description: body.description,
      date: body.date,
      participants: body.participant_ids,
      splits: body.custom_splits,
    });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function getExpenses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as {
      date_from?: string;
      date_to?: string;
      category_id?: string;
      page?: string;
      limit?: string;
    };
    const result = await expenseService.getExpenses(req.params.groupId, {
      date_from: query.date_from,
      date_to: query.date_to,
      category_id: query.category_id,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getExpenseDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const expense = await expenseService.getExpenseDetail(
      req.params.expenseId,
      req.params.groupId,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateExpenseInput;
    const expense = await expenseService.updateExpense(
      req.params.expenseId,
      req.params.groupId,
      req.user!.id,
      req.groupRole!,
      {
        category_id: body.category_id,
        total_amount: body.total_amount,
        paid_by: body.paid_by,
        split_type: body.split_type,
        description: body.description,
        date: body.date,
        participants: body.participant_ids,
        splits: body.custom_splits,
      },
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await expenseService.deleteExpense(
      req.params.expenseId,
      req.params.groupId,
      req.user!.id,
      req.groupRole!,
    );
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}
