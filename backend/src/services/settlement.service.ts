import * as settlementRepo from '../repositories/settlement.repository';
import * as expenseRepo from '../repositories/expense.repository';
import * as groupRepo from '../repositories/group.repository';
import { NotFoundError, ForbiddenError } from '../middlewares/errorHandler.middleware';

// 정산 실행 (BE-22)
export async function createSettlement(params: {
  group_id: string;
  period_start: string; // KST YYYY-MM-DD
  period_end: string;   // KST YYYY-MM-DD
  created_by: string;
}) {
  // 정산 레코드 생성 (period_start/end는 date 타입이므로 원본 날짜 문자열 사용)
  const settlement = await settlementRepo.createSettlement({
    group_id: params.group_id,
    period_start: params.period_start,
    period_end: params.period_end,
    created_by: params.created_by,
  });

  // 기간 내 지출 조회 (date 컬럼: DATE 타입)
  const { expenses } = await expenseRepo.findExpensesByGroup(params.group_id, {
    date_from: params.period_start,
    date_to: params.period_end,
    page: 1,
    limit: 10000,
  });

  // 활성 멤버 목록 조회
  const members = await groupRepo.findGroupMembers(params.group_id);

  // 멤버별 total_paid, total_share 계산
  const memberMap = new Map<string, { total_paid: number; total_share: number }>();
  members.forEach(m => memberMap.set(m.user_id, { total_paid: 0, total_share: 0 }));

  expenses.forEach(expense => {
    // total_paid: 결제자
    const paidByEntry = memberMap.get(expense.paid_by);
    if (paidByEntry) paidByEntry.total_paid += expense.total_amount;

    // total_share: 분담
    expense.splits.forEach(split => {
      const splitEntry = memberMap.get(split.user_id);
      if (splitEntry) splitEntry.total_share += split.amount;
    });
  });

  // settlement_details 생성 (AC-S3: 0건이어도 모든 멤버 레코드 생성)
  // balance는 DB generated column (total_paid - total_share) 이므로 INSERT에서 제외
  const detailsInput = Array.from(memberMap.entries()).map(([userId, sums]) => ({
    settlement_id: settlement.id,
    user_id: userId,
    total_paid: sums.total_paid,
    total_share: sums.total_share,
  }));
  const details = await settlementRepo.createSettlementDetails(detailsInput);

  // 메시지 생성 (AC-M1: 활성 멤버 전원)
  const messagesInput = members.map(m => ({
    settlement_id: settlement.id,
    recipient_user_id: m.user_id,
    content: `정산이 완료되었습니다. (기간: ${params.period_start} ~ ${params.period_end})`,
  }));
  await settlementRepo.createMessages(messagesInput);

  console.info('[SETTLEMENT] Created', { settlementId: settlement.id, groupId: params.group_id });
  return { settlement, details };
}

// 정산 목록 조회 (BE-23)
export async function getSettlements(groupId: string) {
  return settlementRepo.findSettlementsByGroup(groupId);
}

// 정산 상세 조회 (BE-23)
export async function getSettlementDetail(settlementId: string, groupId: string) {
  const settlement = await settlementRepo.findSettlementById(settlementId);
  if (!settlement) throw new NotFoundError('정산을 찾을 수 없습니다.');
  if (settlement.group_id !== groupId) throw new ForbiddenError('접근 권한이 없습니다.');

  const details = await settlementRepo.findSettlementDetails(settlementId);
  return { settlement, details };
}

// 메시지 목록 조회 (BE-24)
export async function getMessages(userId: string, page: number, limit: number) {
  return settlementRepo.findMessagesByRecipient(userId, page, limit);
}
