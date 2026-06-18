import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../Toast';

describe('Toast', () => {
  it('메시지를 렌더링한다', () => {
    render(<Toast message="저장되었습니다." onClose={vi.fn()} />);
    expect(screen.getByText('저장되었습니다.')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast message="메시지" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('role=status 속성이 있다', () => {
    render(<Toast message="메시지" onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('duration=0이면 자동으로 닫히지 않는다', () => {
    const onClose = vi.fn();
    render(<Toast message="메시지" onClose={onClose} duration={0} />);
    expect(onClose).not.toHaveBeenCalled();
  });
});
