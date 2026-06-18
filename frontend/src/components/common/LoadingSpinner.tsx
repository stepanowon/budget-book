export type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export default function LoadingSpinner({
  size = 'md',
  label = '로딩 중...',
}: LoadingSpinnerProps) {
  const px = sizeMap[size];

  return (
    <>
      <style>{`
        @keyframes spinner-rotate { to { transform: rotate(360deg); } }
        .loading-spinner {
          display: inline-block;
          border-radius: 50%;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          animation: spinner-rotate 0.7s linear infinite;
          flex-shrink: 0;
        }
        .loading-spinner--sm { border-width: 2px; }
        .loading-spinner--lg { border-width: 4px; }
      `}</style>
      <span
        role="status"
        aria-label={label}
        className={`loading-spinner loading-spinner--${size}`}
        style={{ width: px, height: px }}
      />
    </>
  );
}
