import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
};

const variantStyles: Record<ButtonVariant, string> = {
  filled: 'btn--filled',
  outlined: 'btn--outlined',
  text: 'btn--text',
  danger: 'btn--danger',
};

export default function Button({
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <>
      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          border-radius: var(--border-radius);
          font-family: var(--font-family);
          font-weight: 500;
          cursor: pointer;
          transition: background var(--transition-fast), box-shadow var(--transition-fast);
          white-space: nowrap;
          min-width: 44px;
          min-height: 44px;
        }
        .btn:disabled {
          cursor: not-allowed;
          background: var(--color-bg-disabled);
          color: var(--color-text-disabled);
          border-color: var(--color-bg-disabled);
          box-shadow: none;
        }
        .btn--sm { font-size: 12px; padding: 6px 16px; min-height: 44px; }
        .btn--md { font-size: 14px; padding: 8px 24px; min-height: 44px; }
        .btn--lg { font-size: 16px; padding: 10px 32px; min-height: 48px; }
        .btn--filled {
          background: var(--color-primary);
          color: #fff;
          border: none;
          box-shadow: 0 1px 2px rgba(0,0,0,.2);
        }
        .btn--filled:hover:not(:disabled) {
          background: var(--color-primary-dark);
          box-shadow: 0 2px 6px rgba(0,0,0,.2);
        }
        .btn--outlined {
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-border);
        }
        .btn--outlined:hover:not(:disabled) {
          background: var(--color-primary-light);
          border-color: #c5d9f6;
        }
        .btn--text {
          background: transparent;
          color: var(--color-primary);
          border: none;
          padding: 8px 12px;
        }
        .btn--text:hover:not(:disabled) {
          background: var(--color-primary-light);
        }
        .btn--danger {
          background: var(--color-danger);
          color: #fff;
          border: none;
          box-shadow: 0 1px 2px rgba(0,0,0,.2);
        }
        .btn--danger:hover:not(:disabled) {
          background: #b5281e;
          box-shadow: 0 2px 6px rgba(0,0,0,.2);
        }
        .btn__spinner {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: btn-spin 0.6s linear infinite;
        }
        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        className={`btn ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        {children}
      </button>
    </>
  );
}
