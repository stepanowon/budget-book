import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('기본 레이블로 렌더링된다', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('로딩 중...')).toBeInTheDocument();
  });

  it('커스텀 레이블이 적용된다', () => {
    render(<LoadingSpinner label="데이터를 불러오는 중" />);
    expect(screen.getByLabelText('데이터를 불러오는 중')).toBeInTheDocument();
  });

  it('sm 사이즈 클래스가 적용된다', () => {
    render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('loading-spinner--sm');
  });

  it('lg 사이즈 클래스가 적용된다', () => {
    render(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('loading-spinner--lg');
  });
});
