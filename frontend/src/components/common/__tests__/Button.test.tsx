import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('텍스트를 렌더링한다', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('클릭 핸들러가 호출된다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>클릭</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서는 클릭되지 않는다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>비활성</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading 상태에서 aria-busy가 true이다', () => {
    render(<Button loading>로딩</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('loading 상태에서 버튼이 비활성화된다', () => {
    render(<Button loading>로딩</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('variant=danger 클래스가 적용된다', () => {
    render(<Button variant="danger">삭제</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });

  it('size=sm 클래스가 적용된다', () => {
    render(<Button size="sm">작은버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-xs');
  });
});
