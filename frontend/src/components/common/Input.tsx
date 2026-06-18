import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

let idCounter = 0;

export default function Input({
  label,
  error,
  id,
  className = '',
  ...rest
}: InputProps) {
  const inputId = id ?? `input-${++idCounter}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[13px] font-medium text-[#202124]" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-11 px-3 border rounded text-sm font-sans text-[#202124] bg-white w-full outline-none transition-colors placeholder-[#9aa0a6] focus:ring-2 focus:ring-primary-light ${
          error
            ? 'border-danger bg-danger-light focus:border-danger focus:ring-[rgba(217,48,37,0.15)]'
            : 'border-border focus:border-primary'
        } ${className}`}
        aria-describedby={errorId}
        aria-invalid={!!error}
        {...rest}
      />
      {error && (
        <span id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
