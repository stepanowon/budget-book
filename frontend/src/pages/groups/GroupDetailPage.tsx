import { useState } from 'react';
import { useNavigate, useParams, useMatch, Outlet } from 'react-router-dom';
import axios from 'axios';
import {
  useGroup,
  useGroupMembers,
  useUpdateGroup,
  useDeactivateGroup,
  useRemoveGroupMember,
} from '@/hooks/useGroups';
import { useSendInvitation } from '@/hooks/useInvitations';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import Modal from '@/components/common/Modal';
import type { UpdateGroupRequest } from '@/types/api';

const btnPrimary =
  'inline-flex items-center justify-center px-5 py-2 bg-primary text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-dark transition-colors disabled:bg-border disabled:text-[#bdc1c6] disabled:cursor-not-allowed';
const btnOutlined =
  'inline-flex items-center justify-center px-5 py-2 bg-transparent text-primary border border-border rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-light transition-colors';
const btnDanger =
  'inline-flex items-center justify-center px-5 py-2 bg-transparent text-danger border border-danger rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-danger-light transition-colors';
const btnDangerFilled =
  'inline-flex items-center justify-center px-5 py-2 bg-danger text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-[#b71c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnDangerSm =
  'inline-flex items-center justify-center px-3.5 py-1.5 bg-transparent text-danger border border-danger rounded text-[13px] font-medium font-sans cursor-pointer min-h-[44px] min-w-[44px] hover:bg-danger-light transition-colors';
const formInput =
  'w-full h-10 px-3 border border-border rounded text-sm text-[#202124] bg-white font-sans box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors';
const badgeBase = 'inline-flex items-center h-[22px] px-2.5 rounded-pill text-xs font-medium whitespace-nowrap';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // URL로 활성 탭 결정 (훅은 항상 무조건 호출)
  const matchExpensesExact = useMatch('/groups/:groupId/expenses');
  const matchExpensesDeep = useMatch('/groups/:groupId/expenses/*');
  const matchSettlement = useMatch('/groups/:groupId/settlements');
  const activeTab = (matchExpensesExact || matchExpensesDeep) ? 'expenses' : matchSettlement ? 'settlement' : 'info';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateGroupRequest>({});
  const [editError, setEditError] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteMessageType, setInviteMessageType] = useState<'success' | 'error'>('success');

  const id = groupId ?? '';

  const { data: group, isLoading, isError } = useGroup(id);
  const { data: members } = useGroupMembers(id);
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup(id);
  const { mutate: deactivateGroup, isPending: isDeactivating } = useDeactivateGroup();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveGroupMember(id);
  const { mutate: sendInvitation, isPending: isSendingInvite } = useSendInvitation(id);

  const handleOpenEdit = () => {
    if (!group) return;
    setEditForm({ name: group.name, start_date: group.start_date, end_date: group.end_date ?? undefined });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name?.trim()) { setEditError('그룹명을 입력해주세요.'); return; }
    updateGroup(editForm, { onSuccess: () => setIsEditOpen(false) });
  };

  const handleDeactivate = () => {
    deactivateGroup(id, { onSuccess: () => navigate(ROUTES.GROUPS) });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    sendInvitation(inviteUsername.trim(), {
      onSuccess: () => {
        setInviteMessage('초대를 보냈습니다');
        setInviteMessageType('success');
        setInviteUsername('');
      },
      onError: (error: unknown) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) setInviteMessage('이미 초대된 사용자입니다');
          else if (error.response?.status === 404) setInviteMessage('해당 username의 사용자를 찾을 수 없습니다');
          else setInviteMessage('초대 발송에 실패했습니다');
        } else {
          setInviteMessage('초대 발송에 실패했습니다');
        }
        setInviteMessageType('error');
      },
    });
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(userId, { onSuccess: () => setRemovingMemberId(null) });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !group) {
    return <ErrorMessage message="그룹 정보를 불러오는 데 실패했습니다." />;
  }

  const isManager = group.my_role === 'MANAGER';
  const fmtDate = (d: string) => d.slice(0, 10);
  const periodText =
    group.type === 'LIMITED'
      ? `${fmtDate(group.start_date)} ~ ${group.end_date ? fmtDate(group.end_date) : ''}`
      : '상시';
  const removingMember = members?.find((m) => m.user_id === removingMemberId);

  const TAB_ITEMS = [
    { key: 'info', label: '정보', to: ROUTES.GROUP_DETAIL(id) },
    { key: 'expenses', label: '지출', to: ROUTES.GROUP_EXPENSES(id) },
    { key: 'settlement', label: '정산', to: ROUTES.GROUP_SETTLEMENTS(id) },
  ] as const;

  return (
    <>
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-[22px] font-medium text-[#202124] m-0">{group.name}</h1>
          {isManager && (
            <div className="flex gap-2 flex-shrink-0">
              <button className={btnOutlined} onClick={handleOpenEdit}>그룹 수정</button>
              <button className={btnDanger} onClick={() => setIsDeactivateOpen(true)}>그룹 비활성화</button>
            </div>
          )}
        </div>

        {/* 탭 바 */}
        <div className="flex gap-1 bg-[#f1f3f4] p-1 rounded-lg mb-6">
          {TAB_ITEMS.map(({ key, label, to }) => (
            <button
              key={key}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium font-sans cursor-pointer border-0 transition-all duration-150 ${
                activeTab === key
                  ? 'bg-white text-primary shadow-sm'
                  : 'bg-transparent text-neutral hover:text-[#202124]'
              }`}
              onClick={() => navigate(to)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 지출/정산/카테고리 탭: 자식 라우트 렌더링 */}
        {activeTab !== 'info' ? (
          <Outlet context={{ isManager }} />
        ) : (
          <>
            {/* 그룹 정보 카드 */}
            <div className="bg-white border border-border rounded-lg p-4 mb-6 shadow-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">그룹명</p>
                  <p className="text-sm font-medium text-[#202124] m-0">{group.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">유형</p>
                  <p className="text-sm font-medium text-[#202124] m-0">{group.type === 'LIMITED' ? '기간제' : '상시'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">기간</p>
                  <p className="text-sm font-medium text-[#202124] m-0">{periodText}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">상태</p>
                  <span className={`${badgeBase} ${group.status === 'ACTIVE' ? 'bg-success-light text-success' : 'bg-border text-neutral'}`}>
                    {group.status === 'ACTIVE' ? '활성' : '비활성'}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">내 역할</p>
                  <span className={`${badgeBase} ${group.my_role === 'MANAGER' ? 'bg-primary text-white' : 'bg-border text-[#202124]'}`}>
                    {group.my_role === 'MANAGER' ? '관리자' : '멤버'}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral m-0 mb-0.5 uppercase tracking-wide">멤버 수</p>
                  <p className="text-sm font-medium text-[#202124] m-0">{group.member_count}명</p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-medium text-[#202124] m-0 mb-4">멤버 목록</h2>
            <div className="flex flex-col gap-2">
              {members && members.length > 0 ? (
                members.map((member) => {
                  const isSelf = member.user_id === currentUser?.id;
                  return (
                    <div key={member.id} className="flex items-center justify-between px-4 py-3 bg-white border border-border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-medium flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-[#202124]">{member.username}</span>
                          <span className="text-[11px] text-neutral">{member.joined_at.slice(0, 10)} 가입</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${badgeBase} ${member.role === 'MANAGER' ? 'bg-primary text-white' : 'bg-border text-[#202124]'}`}>
                          {member.role === 'MANAGER' ? '관리자' : '멤버'}
                        </span>
                        {isManager && !isSelf && (
                          <button className={btnDangerSm} onClick={() => setRemovingMemberId(member.user_id)}>제거</button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-neutral">멤버 정보를 불러오는 중...</p>
              )}
            </div>

            {isManager && (
              <div className="mt-6 p-4 bg-white border border-border rounded">
                <p className="text-[15px] font-medium text-[#202124] m-0 mb-3">멤버 초대</p>
                <form className="flex gap-2 items-end" onSubmit={handleSendInvite} noValidate>
                  <div className="flex-1">
                    <input
                      className={formInput}
                      type="text"
                      placeholder="초대할 username 입력"
                      value={inviteUsername}
                      onChange={(e) => { setInviteUsername(e.target.value); setInviteMessage(''); }}
                      aria-label="초대할 username"
                    />
                  </div>
                  <button className={btnPrimary} type="submit" disabled={isSendingInvite || !inviteUsername.trim()}>
                    {isSendingInvite ? '전송 중...' : '초대 보내기'}
                  </button>
                </form>
                {inviteMessage && (
                  <p className={`mt-2 text-[13px] ${inviteMessageType === 'success' ? 'text-success' : 'text-danger'}`}>
                    {inviteMessage}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 그룹 수정 모달 */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="그룹 수정"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btnOutlined} onClick={() => setIsEditOpen(false)}>취소</button>
            <button className={btnPrimary} onClick={handleUpdateSubmit} disabled={isUpdating}>
              {isUpdating ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral mb-1" htmlFor="edit-group-name">그룹명</label>
            <input id="edit-group-name" className={formInput} type="text" value={editForm.name ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            {editError && <p className="text-xs text-danger mt-1">{editError}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral mb-1" htmlFor="edit-start-date">시작일</label>
            <input id="edit-start-date" className={formInput} type="date" value={editForm.start_date ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, start_date: e.target.value }))} />
          </div>
          {group.type === 'LIMITED' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral mb-1" htmlFor="edit-end-date">종료일</label>
              <input id="edit-end-date" className={formInput} type="date" value={editForm.end_date ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p, end_date: e.target.value }))} />
            </div>
          )}
        </form>
      </Modal>

      {/* 비활성화 확인 모달 */}
      <Modal isOpen={isDeactivateOpen} onClose={() => setIsDeactivateOpen(false)} title="그룹 비활성화"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btnOutlined} onClick={() => setIsDeactivateOpen(false)}>취소</button>
            <button className={btnDangerFilled} onClick={handleDeactivate} disabled={isDeactivating}>
              {isDeactivating ? '처리 중...' : '비활성화'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#202124] m-0">
          그룹 <strong>{group.name}</strong>을(를) 비활성화하시겠습니까?
          비활성화된 그룹은 더 이상 지출을 추가할 수 없습니다.
        </p>
      </Modal>

      {/* 멤버 제거 확인 모달 */}
      <Modal isOpen={removingMemberId !== null} onClose={() => setRemovingMemberId(null)} title="멤버 제거"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btnOutlined} onClick={() => setRemovingMemberId(null)}>취소</button>
            <button className={btnDangerFilled} onClick={() => { if (removingMemberId) handleRemoveMember(removingMemberId); }} disabled={isRemoving}>
              {isRemoving ? '처리 중...' : '제거'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#202124] m-0">
          <strong>{removingMember?.username ?? ''}</strong> 멤버를 그룹에서 제거하시겠습니까?
        </p>
      </Modal>
    </>
  );
}
