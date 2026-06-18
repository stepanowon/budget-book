import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGroups } from '@/hooks/useGroups';
import * as reportApi from '@/api/reportApi';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import MemberPieChart from '@/components/charts/MemberPieChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [groupId, setGroupId] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const { data: groups = [] } = useGroups();

  const params = { date_from: dateFrom, date_to: dateTo };
  const enabled = Boolean(groupId) && Boolean(dateFrom) && Boolean(dateTo);

  const {
    data: categoryData = [],
    isLoading: isLoadingCat,
    isError: isErrorCat,
  } = useQuery({
    queryKey: ['reports', 'categories', groupId, params],
    queryFn: () => reportApi.getCategoryReport(groupId, params),
    enabled,
  });

  const {
    data: memberData = [],
    isLoading: isLoadingMember,
    isError: isErrorMember,
  } = useQuery({
    queryKey: ['reports', 'members', groupId, params],
    queryFn: () => reportApi.getMemberReport(groupId, params),
    enabled,
  });

  const isLoading = isLoadingCat || isLoadingMember;

  return (
    <>
      <style>{`
        .reports-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .reports-page__title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        .reports-page__filters {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
          align-items: flex-end;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-4);
        }
        .reports-filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          min-width: 160px;
        }
        .reports-filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .reports-filter-group select,
        .reports-filter-group input {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          min-height: 44px;
          font-family: var(--font-family);
          color: var(--color-text-primary);
          background: var(--color-surface);
        }
        .reports-page__charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--space-6);
        }
        .reports-page__chart-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-6);
        }
        .reports-page__loading {
          display: flex;
          justify-content: center;
          padding: var(--space-8);
        }
        .reports-page__error {
          color: var(--color-danger);
          font-size: 14px;
          padding: var(--space-4);
        }
      `}</style>
      <div className="reports-page">
        <h1 className="reports-page__title">리포트</h1>

        <div className="reports-page__filters">
          <div className="reports-filter-group">
            <label htmlFor="rp-group">그룹</label>
            <select
              id="rp-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">그룹 선택</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-group">
            <label htmlFor="rp-from">시작일</label>
            <input
              id="rp-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="reports-filter-group">
            <label htmlFor="rp-to">종료일</label>
            <input
              id="rp-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {!groupId ? (
          <EmptyState title="그룹을 선택하세요" description="리포트를 볼 그룹을 선택해 주세요." />
        ) : isLoading ? (
          <div className="reports-page__loading">
            <LoadingSpinner />
          </div>
        ) : isErrorCat || isErrorMember ? (
          <p className="reports-page__error">데이터를 불러오는 중 오류가 발생했습니다.</p>
        ) : categoryData.length === 0 && memberData.length === 0 ? (
          <EmptyState title="해당 기간에 지출 데이터가 없습니다" />
        ) : (
          <div className="reports-page__charts">
            {categoryData.length > 0 && (
              <div className="reports-page__chart-card">
                <CategoryPieChart data={categoryData} />
              </div>
            )}
            {memberData.length > 0 && (
              <div className="reports-page__chart-card">
                <MemberPieChart data={memberData} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
