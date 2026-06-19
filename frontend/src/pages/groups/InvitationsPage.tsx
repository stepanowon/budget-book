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
      <div className="flex justify-center p-12">
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
    <div className="max-w-[640px] mx-auto">
      <h1 className="text-[22px] font-medium text-[#202124] m-0 mb-6">받은 초대</h1>

      {pending.length === 0 ? (
        <p className="text-sm text-neutral text-center py-8">받은 초대가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {pending.map((inv) => {
            const expired = isExpired(inv.expires_at);
            return (
              <li
                key={inv.id}
                className={`flex items-center justify-between p-4 bg-white border border-border rounded gap-3 ${expired ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#202124] m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {inv.group_name}
                  </p>
                  <p className="text-xs text-neutral m-0">초대자: {inv.inviter_username}</p>
                  <p className="text-xs text-neutral m-0 mt-0.5">만료: {inv.expires_at.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {expired ? (
                    <span className="inline-flex items-center h-6 px-2.5 rounded-pill text-xs font-medium bg-border text-neutral">
                      만료됨
                    </span>
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white border-0 rounded text-[13px] font-medium font-sans cursor-pointer min-h-[44px] min-w-[44px] hover:bg-primary-dark transition-colors disabled:bg-border disabled:text-[#bdc1c6] disabled:cursor-not-allowed"
                        onClick={() => handleAccept(inv.id, inv.group_id)}
                        disabled={isPending}
                      >
                        수락
                      </button>
                      <button
                        className="inline-flex items-center justify-center px-4 py-2 bg-transparent text-danger border border-danger rounded text-[13px] font-medium font-sans cursor-pointer min-h-[44px] min-w-[44px] hover:bg-danger-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
