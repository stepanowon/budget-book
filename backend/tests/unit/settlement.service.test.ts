import { createSettlement, getSettlementDetail } from '../../src/services/settlement.service';
import * as settlementRepo from '../../src/repositories/settlement.repository';
import * as expenseRepo from '../../src/repositories/expense.repository';
import * as groupRepo from '../../src/repositories/group.repository';
import { ForbiddenError, NotFoundError } from '../../src/middlewares/errorHandler.middleware';

jest.mock('../../src/repositories/settlement.repository');
jest.mock('../../src/repositories/expense.repository');
jest.mock('../../src/repositories/group.repository');

const mockSettlementRepo = settlementRepo as jest.Mocked<typeof settlementRepo>;
const mockExpenseRepo = expenseRepo as jest.Mocked<typeof expenseRepo>;
const mockGroupRepo = groupRepo as jest.Mocked<typeof groupRepo>;

const mockMembers = [
  { id: 'm1', group_id: 'grp', user_id: 'user-a', role: 'MANAGER' as const, joined_at: '', username: 'alice' },
  { id: 'm2', group_id: 'grp', user_id: 'user-b', role: 'MEMBER' as const, joined_at: '', username: 'bob' },
];

const mockSettlement = {
  id: 'settle-uuid',
  group_id: 'grp',
  period_start: '2026-06-14T15:00:00Z',
  period_end: '2026-06-15T14:59:59.999Z',
  created_by: 'user-a',
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('settlement.service — createSettlement (BE-22)', () => {
  it('지출 0건 기간 정산 시 활성 멤버 수만큼 SettlementDetail 생성 (AC-S3)', async () => {
    mockSettlementRepo.createSettlement.mockResolvedValue(mockSettlement);
    mockExpenseRepo.findExpensesByGroup.mockResolvedValue({ expenses: [], total: 0 });
    mockGroupRepo.findGroupMembers.mockResolvedValue(mockMembers);
    mockSettlementRepo.createSettlementDetails.mockResolvedValue([
      { id: 'd1', settlement_id: 'settle-uuid', user_id: 'user-a', total_paid: 0, total_share: 0, balance: 0 },
      { id: 'd2', settlement_id: 'settle-uuid', user_id: 'user-b', total_paid: 0, total_share: 0, balance: 0 },
    ]);
    mockSettlementRepo.createMessages.mockResolvedValue([]);

    const result = await createSettlement({
      group_id: 'grp',
      period_start: '2026-06-15',
      period_end: '2026-06-15',
      created_by: 'user-a',
    });

    expect(mockSettlementRepo.createSettlementDetails).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'user-a', total_paid: 0, total_share: 0 }),
        expect.objectContaining({ user_id: 'user-b', total_paid: 0, total_share: 0 }),
      ]),
    );
    expect(result.details.length).toBe(2);
  });

  it('정산 후 활성 멤버 전원에게 Message 생성 (AC-M1)', async () => {
    mockSettlementRepo.createSettlement.mockResolvedValue(mockSettlement);
    mockExpenseRepo.findExpensesByGroup.mockResolvedValue({ expenses: [], total: 0 });
    mockGroupRepo.findGroupMembers.mockResolvedValue(mockMembers);
    mockSettlementRepo.createSettlementDetails.mockResolvedValue([]);
    mockSettlementRepo.createMessages.mockResolvedValue([]);

    await createSettlement({
      group_id: 'grp',
      period_start: '2026-06-15',
      period_end: '2026-06-15',
      created_by: 'user-a',
    });

    const messagesArg = mockSettlementRepo.createMessages.mock.calls[0][0];
    const recipientIds = messagesArg.map((m) => m.recipient_user_id);
    expect(recipientIds).toContain('user-a');
    expect(recipientIds).toContain('user-b');
  });

  it('지출이 있는 경우 total_paid/total_share 정확히 집계', async () => {
    const mockExpenses = [
      {
        id: 'exp1',
        group_id: 'grp',
        category_id: 'cat',
        paid_by: 'user-a',
        total_amount: 10000,
        split_type: 'EQUAL' as const,
        date: '2026-06-15',
        description: '',
        created_by: 'user-a',
        created_at: '',
        splits: [
          { id: 's1', expense_id: 'exp1', user_id: 'user-a', amount: 5000 },
          { id: 's2', expense_id: 'exp1', user_id: 'user-b', amount: 5000 },
        ],
      },
    ];

    mockSettlementRepo.createSettlement.mockResolvedValue(mockSettlement);
    mockExpenseRepo.findExpensesByGroup.mockResolvedValue({ expenses: mockExpenses, total: 1 });
    mockGroupRepo.findGroupMembers.mockResolvedValue(mockMembers);
    mockSettlementRepo.createSettlementDetails.mockResolvedValue([]);
    mockSettlementRepo.createMessages.mockResolvedValue([]);

    await createSettlement({
      group_id: 'grp',
      period_start: '2026-06-15',
      period_end: '2026-06-15',
      created_by: 'user-a',
    });

    const detailsArg = mockSettlementRepo.createSettlementDetails.mock.calls[0][0];
    const userADetail = detailsArg.find((d) => d.user_id === 'user-a');
    expect(userADetail?.total_paid).toBe(10000); // 결제자
    expect(userADetail?.total_share).toBe(5000);  // 분담
    const userBDetail = detailsArg.find((d) => d.user_id === 'user-b');
    expect(userBDetail?.total_paid).toBe(0);
    expect(userBDetail?.total_share).toBe(5000);
  });
});

describe('settlement.service — getSettlementDetail (BE-23)', () => {
  it('다른 그룹의 정산 조회 시 ForbiddenError', async () => {
    mockSettlementRepo.findSettlementById.mockResolvedValue({ ...mockSettlement, group_id: 'other-grp' });
    await expect(getSettlementDetail('settle-uuid', 'grp')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('존재하지 않는 정산 조회 시 NotFoundError', async () => {
    mockSettlementRepo.findSettlementById.mockResolvedValue(null);
    await expect(getSettlementDetail('invalid-uuid', 'grp')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('올바른 정산 상세 반환', async () => {
    mockSettlementRepo.findSettlementById.mockResolvedValue(mockSettlement);
    mockSettlementRepo.findSettlementDetails.mockResolvedValue([
      {
        id: 'd1',
        settlement_id: 'settle-uuid',
        user_id: 'user-a',
        total_paid: 10000,
        total_share: 5000,
        balance: 5000,
      },
    ]);

    const result = await getSettlementDetail('settle-uuid', 'grp');
    expect(result.settlement.id).toBe('settle-uuid');
    expect(result.details[0].balance).toBe(5000);
  });
});
