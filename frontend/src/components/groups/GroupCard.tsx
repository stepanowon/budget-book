import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import type { GroupResponse } from '@/types/api';

interface GroupCardProps {
  group: GroupResponse;
}

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
    <>
      <style>{`
        .group-card {
          background: var(--color-surface);
          border: 1px solid #e0e0e0;
          border-radius: var(--radius-md);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition-fast);
          cursor: pointer;
          min-height: 44px;
          text-align: left;
          width: 100%;
        }
        .group-card:hover {
          box-shadow: var(--shadow-md);
        }
        .group-card:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        .group-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }
        .group-card__name {
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .group-card__badges {
          display: flex;
          gap: var(--space-1);
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          height: 22px;
          padding: 0 10px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .badge--type-limited {
          background: var(--color-warning-light);
          color: #b06000;
        }
        .badge--type-unlimited {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .badge--status-active {
          background: var(--color-success-light);
          color: var(--color-success);
        }
        .badge--status-inactive {
          background: var(--color-border-light);
          color: var(--color-text-secondary);
        }
        .badge--role-manager {
          background: var(--color-primary);
          color: #fff;
        }
        .badge--role-member {
          background: var(--color-border);
          color: var(--color-text-primary);
        }
        .group-card__meta {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: var(--space-2);
        }
      `}</style>
      <div
        className="group-card"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${group.name} 그룹 상세 보기`}
      >
        <div className="group-card__header">
          <p className="group-card__name">{group.name}</p>
          <div className="group-card__badges">
            <span
              className={`badge badge--type-${group.type === 'LIMITED' ? 'limited' : 'unlimited'}`}
            >
              {group.type === 'LIMITED' ? '기간제' : '상시'}
            </span>
            <span
              className={`badge badge--status-${group.status === 'ACTIVE' ? 'active' : 'inactive'}`}
            >
              {statusLabel}
            </span>
            <span
              className={`badge badge--role-${group.my_role === 'MANAGER' ? 'manager' : 'member'}`}
            >
              {group.my_role === 'MANAGER' ? '관리자' : '멤버'}
            </span>
          </div>
        </div>
        <div className="group-card__meta">{periodText}</div>
      </div>
    </>
  );
}
