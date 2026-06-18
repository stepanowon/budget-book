import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal', () => {
  it('isOpen=false이면 렌더링되지 않는다', () => {
    render(<Modal isOpen={false} onClose={vi.fn()}>내용</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpen=true이면 렌더링된다', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>내용</Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('title이 표시된다', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="테스트 모달">내용</Modal>);
    expect(screen.getByText('테스트 모달')).toBeInTheDocument();
  });

  it('children이 렌더링된다', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>모달 내용</Modal>);
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="모달">내용</Modal>);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape 키 입력 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="모달">내용</Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('aria-modal 속성이 true이다', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>내용</Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('footer가 렌더링된다', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} footer={<button>확인</button>}>
        내용
      </Modal>,
    );
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });
});
