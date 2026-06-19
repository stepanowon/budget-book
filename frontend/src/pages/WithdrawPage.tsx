import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/contexts/ToastContext';
import * as authApi from '@/api/authApi';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

const inputClass =
  'px-3 py-2 border border-border rounded text-sm font-sans min-h-[44px] text-[#202124] bg-white w-full outline-none focus:border-primary focus:ring-2 focus:ring-primary-light';
const labelClass = 'text-[13px] font-medium text-neutral';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { withdraw, currentUser } = useAuth();
  const { showToast } = useToast();

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [isChangingPw, setIsChangingPw] = useState(false);

  // 회원 탈퇴
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = '현재 비밀번호를 입력해주세요.';
    if (!newPassword) errs.newPassword = '새 비밀번호를 입력해주세요.';
    else if (newPassword.length < 8) errs.newPassword = '비밀번호는 8자 이상이어야 합니다.';
    else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword))
      errs.newPassword = '영문자, 숫자, 특수문자를 모두 포함해야 합니다.';
    if (newPassword !== confirmPassword) errs.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsChangingPw(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      showToast('비밀번호가 변경되었습니다.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '비밀번호 변경 중 오류가 발생했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsChangingPw(false);
    }
  }

  async function handleWithdraw() {
    setIsWithdrawing(true);
    try {
      await withdraw();
      navigate(ROUTES.LOGIN, { replace: true });
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <>
      <div className="max-w-[480px] flex flex-col gap-8">
        <h1 className="text-xl font-semibold text-[#202124] m-0">계정 설정</h1>
        {currentUser && (
          <div className="bg-white border border-border rounded-lg p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#202124] m-0">{currentUser.username}</p>
              <p className="text-xs text-neutral m-0 mt-0.5">로그인 중</p>
            </div>
          </div>
        )}

        {/* 비밀번호 변경 */}
        <section className="bg-white border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#202124] m-0 mb-5">비밀번호 변경</h2>
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleChangePassword(e)} noValidate>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="current-pw">현재 비밀번호</label>
              <input
                id="current-pw"
                className={inputClass}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              {pwErrors.currentPassword && <span className="text-xs text-danger">{pwErrors.currentPassword}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="new-pw">새 비밀번호</label>
              <input
                id="new-pw"
                className={inputClass}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              {pwErrors.newPassword && <span className="text-xs text-danger">{pwErrors.newPassword}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="confirm-pw">새 비밀번호 확인</label>
              <input
                id="confirm-pw"
                className={inputClass}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {pwErrors.confirmPassword && <span className="text-xs text-danger">{pwErrors.confirmPassword}</span>}
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={isChangingPw}>변경하기</Button>
            </div>
          </form>
        </section>

        {/* 회원 탈퇴 */}
        <section className="bg-white border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#202124] m-0 mb-2">회원 탈퇴</h2>
          <p className="text-sm text-neutral m-0 mb-4 leading-relaxed">
            탈퇴 후 계정 정보는 복구되지 않습니다. 그룹 내 지출 기록은 유지됩니다.
          </p>
          <Button variant="danger" onClick={() => setIsModalOpen(true)}>회원 탈퇴</Button>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isWithdrawing && setIsModalOpen(false)}
        title="회원 탈퇴"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outlined" onClick={() => setIsModalOpen(false)} disabled={isWithdrawing}>
              취소
            </Button>
            <Button variant="danger" loading={isWithdrawing} onClick={() => void handleWithdraw()}>
              탈퇴하기
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#202124] leading-relaxed m-0">
          탈퇴 후 계정 정보는 복구되지 않습니다. 그룹 내 지출 기록은 유지됩니다.
        </p>
      </Modal>
    </>
  );
}
