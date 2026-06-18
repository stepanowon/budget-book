import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('메시지를 렌더링한다', () => {
    render(<ErrorMessage message="오류가 발생했습니다." />);
    expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument();
  });

  it('role=alert 속성이 있다', () => {
    render(<ErrorMessage message="에러" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('aria-live=assertive 속성이 있다', () => {
    render(<ErrorMessage message="에러" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});
