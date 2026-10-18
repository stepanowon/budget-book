/**
 * report.service 단위 테스트 (BE-28 커버리지 보완)
 */

import * as reportService from '../../src/services/report.service';
import * as reportRepo from '../../src/repositories/report.repository';

jest.mock('../../src/repositories/report.repository');

const mockReportRepo = reportRepo as jest.Mocked<typeof reportRepo>;

beforeEach(() => jest.clearAllMocks());

describe('report.service — getCategoryReport', () => {
  it('카테고리별 리포트를 반환한다', async () => {
    const mockData = [
      { category_id: 'cat-1', category_name: '식비', total: 50000 },
      { category_id: 'cat-2', category_name: '교통', total: 20000 },
    ];
    mockReportRepo.getCategoryReport.mockResolvedValue(mockData);

    const result = await reportService.getCategoryReport('grp-1', '2025-01-01', '2025-01-31');

    expect(result).toEqual(mockData);
    expect(mockReportRepo.getCategoryReport).toHaveBeenCalledWith('grp-1', '2025-01-01', '2025-01-31');
  });

  it('데이터가 없으면 빈 배열을 반환한다', async () => {
    mockReportRepo.getCategoryReport.mockResolvedValue([]);

    const result = await reportService.getCategoryReport('grp-1', '2025-02-01', '2025-02-28');

    expect(result).toEqual([]);
  });
});

describe('report.service — getMemberReport', () => {
  it('멤버별 리포트를 반환한다', async () => {
    const mockData = [
      { user_id: 'u1', username: 'alice', total_share: 30000, total_paid: 50000 },
    ];
    mockReportRepo.getMemberReport.mockResolvedValue(mockData);

    const result = await reportService.getMemberReport('grp-1', '2025-01-01', '2025-01-31');

    expect(result).toEqual(mockData);
    expect(mockReportRepo.getMemberReport).toHaveBeenCalledWith('grp-1', '2025-01-01', '2025-01-31');
  });
});

describe('report.service — getExpenseExcelData', () => {
  it('지출 엑셀 데이터를 반환한다', async () => {
    const mockData = [{ id: 'exp-1', date: '2025-01-15', total_amount: 15000 }];
    mockReportRepo.getExpensesForExcel.mockResolvedValue(mockData);

    const result = await reportService.getExpenseExcelData('grp-1', '2025-01-01', '2025-01-31');

    expect(result).toEqual(mockData);
    expect(mockReportRepo.getExpensesForExcel).toHaveBeenCalledWith('grp-1', '2025-01-01', '2025-01-31');
  });
});

describe('report.service — getSettlementExcelData', () => {
  it('정산 엑셀 데이터를 반환한다', async () => {
    const mockResult = {
      settlement: { id: 'settle-1', group_id: 'grp-1' },
      details: [{ user_id: 'u1', total_paid: 50000, total_share: 30000, balance: 20000 }],
    };
    mockReportRepo.getSettlementForExcel.mockResolvedValue(mockResult);

    const result = await reportService.getSettlementExcelData('settle-1');

    expect(result).toEqual(mockResult);
    expect(mockReportRepo.getSettlementForExcel).toHaveBeenCalledWith('settle-1');
  });
});
