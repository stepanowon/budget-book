import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

type ActiveTab = 'info' | 'expenses' | 'settlement';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<UpdateGroupRequest>({});
  const [editError, setEditError] = useState('');

  // 초대 발송 상태
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
    setEditForm({
      name: group.name,
      start_date: group.start_date,
      end_date: group.end_date ?? undefined,
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name?.trim()) {
      setEditError('그룹명을 입력해주세요.');
      return;
    }
    updateGroup(editForm, {
      onSuccess: () => {
        setIsEditOpen(false);
      },
    });
  };

  const handleDeactivate = () => {
    deactivateGroup(id, {
      onSuccess: () => {
        navigate(ROUTES.GROUPS);
      },
    });
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
          if (error.response?.status === 409) {
            setInviteMessage('이미 초대된 사용자입니다');
          } else if (error.response?.status === 404) {
            setInviteMessage('해당 username의 사용자를 찾을 수 없습니다');
          } else {
            setInviteMessage('초대 발송에 실패했습니다');
          }
        } else {
          setInviteMessage('초대 발송에 실패했습니다');
        }
        setInviteMessageType('error');
      },
    });
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(userId, {
      onSuccess: () => {
        setRemovingMemberId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !group) {
    return <ErrorMessage message="그룹 정보를 불러오는 데 실패했습니다." />;
  }

  const isManager = group.my_role === 'MANAGER';

  const periodText =
    group.type === 'LIMITED'
      ? `${group.start_date} ~ ${group.end_date ?? ''}`
      : '상시';

  const removingMember = members?.find((m) => m.user_id === removingMemberId);

  return (
    <>
      <style>{`
        .group-detail-page {
          padding: var(--space-6) var(--space-8);
          max-width: 800px;
          margin: 0 auto;
        }
        .group-detail-page__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .group-detail-page__title {
          font-size: 22px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .manager-actions {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
        }
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-6);
          gap: 0;
        }
        .tab-btn {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          color: var(--color-text-secondary);
          cursor: pointer;
          min-height: 44px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .tab-btn:hover {
          color: var(--color-primary);
          background: var(--color-primary-light);
        }
        .tab-btn--active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .info-item__label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-1);
        }
        .info-item__value {
          font-size: 14px;
          color: var(--color-text-primary);
          margin: 0;
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
        .badge--active { background: var(--color-success-light); color: var(--color-success); }
        .badge--inactive { background: var(--color-border-light); color: var(--color-text-secondary); }
        .badge--manager { background: var(--color-primary); color: #fff; }
        .badge--member { background: var(--color-border); color: var(--color-text-primary); }
        .section-title {
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-4);
        }
        .member-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .member-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        .member-item__info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .member-item__meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .member-item__username {
          font-size: 14px;
          color: var(--color-text-primary);
        }
        .member-item__joined {
          font-size: 11px;
          color: var(--color-text-secondary);
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .member-item__actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 20px;
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
        }
        .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
        .btn-primary:disabled { background: var(--color-border); color: var(--color-text-disabled); cursor: not-allowed; }
        .btn-outlined {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 19px;
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
        }
        .btn-outlined:hover { background: var(--color-primary-light); }
        .btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 19px;
          background: transparent;
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
        }
        .btn-danger:hover { background: var(--color-danger-light); }
        .btn-danger--filled {
          background: var(--color-danger);
          color: #fff;
        }
        .btn-danger--filled:hover { background: #b71c1c; }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
          min-height: 44px;
          min-width: 44px;
        }
        .form-group { margin-bottom: var(--space-4); }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-1);
        }
        .form-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-primary);
          background: var(--color-surface);
          font-family: var(--font-family);
          box-sizing: border-box;
          transition: border-color var(--transition-fast);
        }
        .form-input:focus {
          border-color: var(--color-primary);
          outline: 2px solid var(--color-primary-light);
          outline-offset: 0;
        }
        .form-error { font-size: 12px; color: var(--color-danger); margin-top: var(--space-1); }
        .confirm-text { font-size: 14px; color: var(--color-text-primary); margin: 0; }
        .modal-footer-btns {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
        }
        .invite-section {
          margin-top: var(--space-6);
          padding: var(--space-4);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        .invite-section__title {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
        }
        .invite-form {
          display: flex;
          gap: var(--space-2);
          align-items: flex-end;
        }
        .invite-form__input-wrap {
          flex: 1;
        }
        .invite-message {
          margin-top: var(--space-2);
          font-size: 13px;
        }
        .invite-message--success { color: var(--color-success); }
        .invite-message--error { color: var(--color-danger); }
      `}</style>

      <div className="group-detail-page">
        <div className="group-detail-page__header">
          <h1 className="group-detail-page__title">{group.name}</h1>
          {isManager && (
            <div className="manager-actions">
              <button className="btn-outlined" onClick={handleOpenEdit}>
                그룹 수정
              </button>
              <button className="btn-danger" onClick={() => setIsDeactivateOpen(true)}>
                그룹 비활성화
              </button>
            </div>
          )}
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === 'info' ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            정보
          </button>
          <button
            className={`tab-btn${activeTab === 'expenses' ? ' tab-btn--active' : ''}`}
            onClick={() => {
              navigate(ROUTES.GROUP_EXPENSES(group.id));
            }}
          >
            지출
          </button>
          <button
            className={`tab-btn${activeTab === 'settlement' ? ' tab-btn--active' : ''}`}
            onClick={() => {
              navigate(ROUTES.GROUP_SETTLEMENTS(group.id));
            }}
          >
            정산
          </button>
        </div>

        {activeTab === 'info' && (
          <>
            <div className="info-grid">
              <div className="info-item">
                <p className="info-item__label">그룹명</p>
                <p className="info-item__value">{group.name}</p>
              </div>
              <div className="info-item">
                <p className="info-item__label">유형</p>
                <p className="info-item__value">
                  {group.type === 'LIMITED' ? '기간제' : '상시'}
                </p>
              </div>
              <div className="info-item">
                <p className="info-item__label">기간</p>
                <p className="info-item__value">{periodText}</p>
              </div>
              <div className="info-item">
                <p className="info-item__label">상태</p>
                <span className={`badge badge--${group.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                  {group.status === 'ACTIVE' ? '활성' : '비활성'}
                </span>
              </div>
              <div className="info-item">
                <p className="info-item__label">내 역할</p>
                <span className={`badge badge--${group.my_role === 'MANAGER' ? 'manager' : 'member'}`}>
                  {group.my_role === 'MANAGER' ? '관리자' : '멤버'}
                </span>
              </div>
              <div className="info-item">
                <p className="info-item__label">멤버 수</p>
                <p className="info-item__value">{group.member_count}명</p>
              </div>
            </div>

            <h2 className="section-title">멤버 목록</h2>
            <div className="member-list">
              {members && members.length > 0 ? (
                members.map((member) => {
                  const isSelf = member.user_id === currentUser?.id;
                  return (
                    <div key={member.id} className="member-item">
                      <div className="member-item__info">
                        <div className="avatar" aria-hidden="true">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-item__meta">
                          <span className="member-item__username">{member.username}</span>
                          <span className="member-item__joined">
                            {member.joined_at.slice(0, 10)} 가입
                          </span>
                        </div>
                      </div>
                      <div className="member-item__actions">
                        <span className={`badge badge--${member.role === 'MANAGER' ? 'manager' : 'member'}`}>
                          {member.role === 'MANAGER' ? '관리자' : '멤버'}
                        </span>
                        {isManager && !isSelf && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => setRemovingMemberId(member.user_id)}
                          >
                            제거
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  멤버 정보를 불러오는 중...
                </p>
              )}
            </div>

            {/* FE-17: MANAGER용 초대 발송 */}
            {isManager && (
              <div className="invite-section">
                <p className="invite-section__title">멤버 초대</p>
                <form className="invite-form" onSubmit={handleSendInvite} noValidate>
                  <div className="invite-form__input-wrap">
                    <input
                      className="form-input"
                      type="text"
                      placeholder="초대할 username 입력"
                      value={inviteUsername}
                      onChange={(e) => {
                        setInviteUsername(e.target.value);
                        setInviteMessage('');
                      }}
                      aria-label="초대할 username"
                    />
                  </div>
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={isSendingInvite || !inviteUsername.trim()}
                  >
                    {isSendingInvite ? '전송 중...' : '초대 보내기'}
                  </button>
                </form>
                {inviteMessage && (
                  <p className={`invite-message invite-message--${inviteMessageType}`}>
                    {inviteMessage}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 그룹 수정 모달 */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="그룹 수정"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-outlined" onClick={() => setIsEditOpen(false)}>
              취소
            </button>
            <button
              className="btn-primary"
              onClick={handleUpdateSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-group-name">
              그룹명
            </label>
            <input
              id="edit-group-name"
              className="form-input"
              type="text"
              value={editForm.name ?? ''}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            {editError && <p className="form-error">{editError}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-start-date">
              시작일
            </label>
            <input
              id="edit-start-date"
              className="form-input"
              type="date"
              value={editForm.start_date ?? ''}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />
          </div>
          {group.type === 'LIMITED' && (
            <div className="form-group">
              <label className="form-label" htmlFor="edit-end-date">
                종료일
              </label>
              <input
                id="edit-end-date"
                className="form-input"
                type="date"
                value={editForm.end_date ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
          )}
        </form>
      </Modal>

      {/* 비활성화 확인 모달 */}
      <Modal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        title="그룹 비활성화"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-outlined" onClick={() => setIsDeactivateOpen(false)}>
              취소
            </button>
            <button
              className="btn-danger btn-danger--filled"
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating ? '처리 중...' : '비활성화'}
            </button>
          </div>
        }
      >
        <p className="confirm-text">
          그룹 <strong>{group.name}</strong>을(를) 비활성화하시겠습니까?
          비활성화된 그룹은 더 이상 지출을 추가할 수 없습니다.
        </p>
      </Modal>

      {/* 멤버 제거 확인 모달 */}
      <Modal
        isOpen={removingMemberId !== null}
        onClose={() => setRemovingMemberId(null)}
        title="멤버 제거"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-outlined" onClick={() => setRemovingMemberId(null)}>
              취소
            </button>
            <button
              className="btn-danger btn-danger--filled"
              onClick={() => {
                if (removingMemberId) handleRemoveMember(removingMemberId);
              }}
              disabled={isRemoving}
            >
              {isRemoving ? '처리 중...' : '제거'}
            </button>
          </div>
        }
      >
        <p className="confirm-text">
          <strong>{removingMember?.username ?? ''}</strong> 멤버를 그룹에서 제거하시겠습니까?
        </p>
      </Modal>
    </>
  );
}
