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
      <div className="max-w-[480px] mx-auto py-8 px-4">
        <h1 className="text-xl font-semibold text-[#202124] m-0 mb-4">계정 설정</h1>
        <p className="text-sm text-neutral m-0 mb-8 leading-relaxed">
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
          <div className="flex gap-2 justify-end">
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
        <p className="text-sm text-[#202124] leading-relaxed m-0">
          탈퇴 후 계정 정보는 복구되지 않습니다. 그룹 내 지출 기록은 유지됩니다.
        </p>
      </Modal>
    </>
  );
}
