import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded font-medium cursor-pointer transition-colors whitespace-nowrap min-w-[44px] min-h-[44px] font-sans';

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-4 py-1.5 min-h-[44px]',
  md: 'text-sm px-6 py-2 min-h-[44px]',
  lg: 'text-base px-8 py-2.5 min-h-[48px]',
};

const variantClasses: Record<ButtonVariant, string> = {
  filled:
    'bg-primary text-white border-0 shadow-sm hover:bg-primary-dark hover:shadow disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] disabled:cursor-not-allowed disabled:shadow-none',
  outlined:
    'bg-transparent text-primary border border-border hover:bg-primary-light hover:border-[#c5d9f6] disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] disabled:border-[#f1f3f4] disabled:cursor-not-allowed',
  text: 'bg-transparent text-primary border-0 px-3 py-2 hover:bg-primary-light disabled:bg-transparent disabled:text-[#bdc1c6] disabled:cursor-not-allowed',
  danger:
    'bg-danger text-white border-0 shadow-sm hover:bg-[#b5281e] hover:shadow disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] disabled:cursor-not-allowed disabled:shadow-none',
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
        @keyframes btn-spin { to { transform: rotate(360deg); } }
        .btn-spinner {
          width: 14px; height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: btn-spin 0.6s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {children}
      </button>
    </>
  );
}
