interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-center gap-2 px-4 py-3 bg-danger-light border border-danger rounded text-danger text-sm ${className}`}
    >
      {message}
    </div>
  );
}
