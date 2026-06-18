import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { ROUTES } from '@/constants/routes';
import GroupCard from '@/components/groups/GroupCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';

export default function GroupListPage() {
  const navigate = useNavigate();
  const { data: groups, isLoading, isError } = useGroups();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="그룹 목록을 불러오는 데 실패했습니다." />;
  }

  return (
    <>
      <style>{`
        .group-list-page {
          padding: var(--space-6) var(--space-8);
          max-width: var(--content-max-width);
          margin: 0 auto;
        }
        .group-list-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }
        .group-list-page__title {
          font-size: 22px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .group-list-page__create-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 8px 24px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }
        .group-list-page__create-btn:hover {
          background: var(--color-primary-dark);
          box-shadow: var(--shadow-md);
        }
        .group-list-page__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
        }
      `}</style>
      <div className="group-list-page">
        <div className="group-list-page__header">
          <h1 className="group-list-page__title">내 그룹</h1>
          <button
            className="group-list-page__create-btn"
            onClick={() => navigate(ROUTES.GROUP_CREATE)}
          >
            + 그룹 만들기
          </button>
        </div>

        {!groups || groups.length === 0 ? (
          <EmptyState
            title="참여 중인 그룹이 없습니다. 그룹을 만들어보세요!"
            action={{
              label: '그룹 만들기',
              onClick: () => navigate(ROUTES.GROUP_CREATE),
            }}
          />
        ) : (
          <div className="group-list-page__grid">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
