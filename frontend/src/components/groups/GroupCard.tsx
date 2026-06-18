import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import type { GroupResponse } from '@/types/api';

interface GroupCardProps {
  group: GroupResponse;
}

const badgeBase = 'inline-flex items-center h-[22px] px-2.5 rounded-pill text-xs font-medium whitespace-nowrap';

export default function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(ROUTES.GROUP_DETAIL(group.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const periodText =
    group.type === 'LIMITED'
      ? `${group.start_date} ~ ${group.end_date ?? ''}`
      : '상시';

  const statusLabel = group.status === 'ACTIVE' ? '활성' : '비활성';

  return (
    <div
      className="bg-white border border-[#e0e0e0] rounded p-4 shadow-[0_1px_2px_rgba(60,64,67,0.1)] hover:shadow-[0_2px_6px_rgba(60,64,67,0.15)] transition-shadow cursor-pointer min-h-[44px] text-left w-full focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${group.name} 그룹 상세 보기`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-base font-medium text-[#202124] m-0">{group.name}</p>
        <div className="flex gap-1 flex-wrap justify-end">
          <span
            className={`${badgeBase} ${
              group.type === 'LIMITED'
                ? 'bg-[#fef7e0] text-[#b06000]'
                : 'bg-primary-light text-primary'
            }`}
          >
            {group.type === 'LIMITED' ? '기간제' : '상시'}
          </span>
          <span
            className={`${badgeBase} ${
              group.status === 'ACTIVE'
                ? 'bg-success-light text-success'
                : 'bg-border text-neutral'
            }`}
          >
            {statusLabel}
          </span>
          <span
            className={`${badgeBase} ${
              group.my_role === 'MANAGER'
                ? 'bg-primary text-white'
                : 'bg-border text-[#202124]'
            }`}
          >
            {group.my_role === 'MANAGER' ? '관리자' : '멤버'}
          </span>
        </div>
      </div>
      <div className="text-[13px] text-neutral mt-2">{periodText}</div>
    </div>
  );
}
