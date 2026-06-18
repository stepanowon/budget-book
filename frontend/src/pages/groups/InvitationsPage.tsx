import { useNavigate } from 'react-router-dom';
import { useMyInvitations, useRespondToInvitation } from '@/hooks/useInvitations';
import { ROUTES } from '@/constants/routes';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

export default function InvitationsPage() {
  const navigate = useNavigate();
  const { data: invitations, isLoading, isError } = useMyInvitations();
  const { mutate: respond, isPending } = useRespondToInvitation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="초대 목록을 불러오는 데 실패했습니다." />;
  }

  const pending = (invitations ?? []).filter((inv) => inv.status === 'PENDING');
  const now = new Date();

  const isExpired = (expiresAt: string) => new Date(expiresAt) < now;

  const handleAccept = (invitationId: string, groupId: string) => {
    respond(
      { invitationId, action: 'ACCEPT' },
      {
        onSuccess: () => {
          navigate(ROUTES.GROUP_DETAIL(groupId));
        },
      },
    );
  };

  const handleDecline = (invitationId: string) => {
    respond({ invitationId, action: 'DECLINE' });
  };

  return (
    <>
      <style>{`
        .invitations-page {
          padding: var(--space-6) var(--space-8);
          max-width: 640px;
          margin: 0 auto;
        }
        .invitations-page__title {
          font-size: 22px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-6);
        }
        .invitation-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .invitation-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          gap: var(--space-3);
        }
        .invitation-card--expired {
          opacity: 0.6;
        }
        .invitation-card__info {
          flex: 1;
          min-width: 0;
        }
        .invitation-card__group-name {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .invitation-card__meta {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0;
        }
        .invitation-card__actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-shrink: 0;
        }
        .badge-expired {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 10px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 500;
          background: var(--color-border-light);
          color: var(--color-text-secondary);
        }
        .btn-accept {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 16px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          transition: background var(--transition-fast);
        }
        .btn-accept:disabled {
          background: var(--color-border);
          color: var(--color-text-disabled);
          cursor: not-allowed;
        }
        .btn-accept:hover:not(:disabled) { background: var(--color-primary-dark); }
        .btn-decline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 16px;
          background: transparent;
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          transition: background var(--transition-fast);
        }
        .btn-decline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-decline:hover:not(:disabled) { background: var(--color-danger-light); }
        .empty-text {
          font-size: 14px;
          color: var(--color-text-secondary);
          text-align: center;
          padding: var(--space-8) 0;
        }
      `}</style>

      <div className="invitations-page">
        <h1 className="invitations-page__title">받은 초대</h1>

        {pending.length === 0 ? (
          <p className="empty-text">받은 초대가 없습니다.</p>
        ) : (
          <ul className="invitation-list" role="list">
            {pending.map((inv) => {
              const expired = isExpired(inv.expires_at);
              return (
                <li
                  key={inv.id}
                  className={`invitation-card${expired ? ' invitation-card--expired' : ''}`}
                >
                  <div className="invitation-card__info">
                    <p className="invitation-card__group-name">{inv.group_name}</p>
                    <p className="invitation-card__meta">
                      초대자: {inv.inviter_username} &middot; 만료: {inv.expires_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="invitation-card__actions">
                    {expired ? (
                      <span className="badge-expired">만료됨</span>
                    ) : (
                      <>
                        <button
                          className="btn-accept"
                          onClick={() => handleAccept(inv.id, inv.group_id)}
                          disabled={isPending}
                        >
                          수락
                        </button>
                        <button
                          className="btn-decline"
                          onClick={() => handleDecline(inv.id)}
                          disabled={isPending}
                        >
                          거절
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
