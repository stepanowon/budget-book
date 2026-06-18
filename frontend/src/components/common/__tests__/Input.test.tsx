import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('레이블이 렌더링된다', () => {
    render(<Input label="이름" />);
    expect(screen.getByText('이름')).toBeInTheDocument();
  });

  it('레이블과 인풋이 연결된다', () => {
    render(<Input label="이메일" id="email-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email-input');
    const label = screen.getByText('이메일');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('에러 메시지가 표시된다', () => {
    render(<Input error="필수 항목입니다." />);
    expect(screen.getByRole('alert')).toHaveTextContent('필수 항목입니다.');
  });

  it('에러 상태에서 aria-invalid가 true이다', () => {
    render(<Input error="에러" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('에러가 없으면 aria-invalid가 false이다', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('에러 메시지와 인풋이 aria-describedby로 연결된다', () => {
    render(<Input id="test-input" error="에러" />);
    const input = screen.getByRole('textbox');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent('에러');
  });

  it('placeholder가 적용된다', () => {
    render(<Input placeholder="입력하세요" />);
    expect(screen.getByPlaceholderText('입력하세요')).toBeInTheDocument();
  });
});
