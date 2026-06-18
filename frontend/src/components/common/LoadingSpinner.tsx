export type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-[3px]',
  lg: 'w-10 h-10 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  label = '로딩 중...',
}: LoadingSpinnerProps) {
  return (
    <>
      <style>{`
        @keyframes spinner-rotate { to { transform: rotate(360deg); } }
        .spinner-anim { animation: spinner-rotate 0.7s linear infinite; }
      `}</style>
      <span
        role="status"
        aria-label={label}
        className={`inline-block rounded-full border-border border-t-primary flex-shrink-0 spinner-anim ${sizeClasses[size]}`}
      />
    </>
  );
}
