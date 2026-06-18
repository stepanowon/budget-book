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
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="그룹 목록을 불러오는 데 실패했습니다." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-medium text-[#202124] m-0">내 그룹</h1>
        <button
          className="inline-flex items-center gap-1 px-6 py-2 bg-primary text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-dark shadow-sm hover:shadow transition-all"
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
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
