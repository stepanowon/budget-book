import * as reportRepo from '../repositories/report.repository';

export async function getCategoryReport(
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  return reportRepo.getCategoryReport(groupId, periodStart, periodEnd);
}

export async function getMemberReport(
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  return reportRepo.getMemberReport(groupId, periodStart, periodEnd);
}

export async function getExpenseExcelData(
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  return reportRepo.getExpensesForExcel(groupId, periodStart, periodEnd);
}

export async function getSettlementExcelData(settlementId: string) {
  return reportRepo.getSettlementForExcel(settlementId);
}
