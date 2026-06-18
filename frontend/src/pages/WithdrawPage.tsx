import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { withdraw } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleWithdraw() {
    setIsLoading(true);
    try {
      await withdraw();
      navigate(ROUTES.LOGIN, { replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .withdraw-page {
          max-width: 480px;
          margin: 0 auto;
          padding: var(--space-8) var(--space-4);
        }
        .withdraw-page__title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-4);
        }
        .withdraw-page__desc {
          font-size: 14px;
          color: var(--color-neutral, #5f6368);
          margin: 0 0 var(--space-8);
          line-height: 1.6;
        }
        .withdraw-modal__message {
          font-size: 14px;
          color: var(--color-text-primary);
          line-height: 1.6;
          margin: 0;
        }
        .withdraw-modal__actions {
          display: flex;
          gap: var(--space-2);
          justify-content: flex-end;
        }
      `}</style>
      <div className="withdraw-page">
        <h1 className="withdraw-page__title">계정 설정</h1>
        <p className="withdraw-page__desc">
          계정을 탈퇴하면 모든 개인 정보가 삭제됩니다.
        </p>
        <Button
          variant="danger"
          size="md"
          onClick={() => setIsModalOpen(true)}
        >
          회원 탈퇴
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title="회원 탈퇴"
        footer={
          <div className="withdraw-modal__actions">
            <Button
              variant="outlined"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              onClick={handleWithdraw}
            >
              탈퇴하기
            </Button>
          </div>
        }
      >
        <p className="withdraw-modal__message">
          탈퇴 후 계정 정보는 복구되지 않습니다. 그룹 내 지출 기록은 유지됩니다.
        </p>
      </Modal>
    </>
  );
}
