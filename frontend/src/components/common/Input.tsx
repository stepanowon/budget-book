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
    <>
      <style>{`
        .input-wrapper { display: flex; flex-direction: column; gap: var(--space-1); }
        .input-label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .input-field {
          height: 44px;
          padding: 0 var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          font-family: var(--font-family);
          color: var(--color-text-primary);
          background: var(--color-surface);
          transition: border-color var(--transition-fast);
          outline: none;
          width: 100%;
        }
        .input-field:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }
        .input-field::placeholder { color: var(--color-placeholder); }
        .input-field--error {
          border-color: var(--color-danger);
          background: var(--color-danger-light);
        }
        .input-field--error:focus {
          border-color: var(--color-danger);
          box-shadow: 0 0 0 2px rgba(217,48,37,.15);
        }
        .input-error { font-size: 12px; color: var(--color-danger); }
      `}</style>
      <div className="input-wrapper">
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={`input-field ${error ? 'input-field--error' : ''} ${className}`}
          aria-describedby={errorId}
          aria-invalid={!!error}
          {...rest}
        />
        {error && (
          <span id={errorId} className="input-error" role="alert">
            {error}
          </span>
        )}
      </div>
    </>
  );
}
