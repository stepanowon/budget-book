import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { HTTP_STATUS } from '../constants/errorCodes';
import ExcelJS from 'exceljs';

export async function getCategoryReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { period_start, period_end } = req.query as Record<string, string>;
    const data = await reportService.getCategoryReport(
      req.params.groupId,
      period_start,
      period_end,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMemberReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { period_start, period_end } = req.query as Record<string, string>;
    const data = await reportService.getMemberReport(
      req.params.groupId,
      period_start,
      period_end,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function exportExpensesExcel(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { period_start, period_end } = req.query as Record<string, string>;
    const expenses = await reportService.getExpenseExcelData(
      req.params.groupId,
      period_start,
      period_end,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('지출 내역');
    sheet.columns = [
      { header: '날짜', key: 'date', width: 15 },
      { header: '카테고리', key: 'category', width: 15 },
      { header: '금액', key: 'total_amount', width: 15 },
      { header: '결제자', key: 'payer', width: 15 },
      { header: '설명', key: 'description', width: 30 },
      { header: '분담 내역', key: 'splits', width: 40 },
    ];

    (expenses as Record<string, unknown>[]).forEach((e) => {
      const expenseSplits = (e['splits'] as Record<string, unknown>[]) ?? [];
      const splitsStr = expenseSplits
        .map((s) => {
          return `${s['split_username'] ?? s['user_id']}: ${s['amount']}원`;
        })
        .join(', ');
      sheet.addRow({
        date: e['date'],
        category: e['category_name'] ?? '',
        total_amount: e['total_amount'],
        payer: e['payer_username'] ?? e['paid_by'],
        description: e['description'] ?? '',
        splits: splitsStr,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expenses_${period_start}_${period_end}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function exportSettlementExcel(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { settlement, details } = await reportService.getSettlementExcelData(
      req.params.settlementId,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('정산 내역');
    sheet.columns = [
      { header: '멤버', key: 'username', width: 20 },
      { header: '결제액', key: 'total_paid', width: 15 },
      { header: '분담액', key: 'total_share', width: 15 },
      { header: '차액', key: 'balance', width: 15 },
    ];

    (details as Record<string, unknown>[]).forEach((d) => {
      sheet.addRow({
        username: d['username'] ?? d['user_id'],
        total_paid: d['total_paid'],
        total_share: d['total_share'],
        balance: d['balance'],
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="settlement_${(settlement as Record<string, unknown>)['id']}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}
