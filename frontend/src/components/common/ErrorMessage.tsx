interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <>
      <style>{`
        .error-message {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--color-danger-light);
          border: 1px solid var(--color-danger);
          border-radius: var(--border-radius);
          color: var(--color-danger);
          font-size: 14px;
        }
      `}</style>
      <div
        role="alert"
        aria-live="assertive"
        className={`error-message ${className}`}
      >
        {message}
      </div>
    </>
  );
}
