import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-success-light border-success text-success',
  error:   'bg-danger-light border-danger text-danger',
  info:    'bg-primary-light border-primary text-primary',
};

export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast-anim { animation: toast-in 0.2s ease; }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className={`toast-anim fixed bottom-6 right-6 flex items-center justify-between gap-4 px-4 py-3 rounded border shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-sm z-[2000] min-w-[240px] max-w-[400px] ${typeClasses[type]}`}
      >
        <span>{message}</span>
        <button
          className="bg-transparent border-0 cursor-pointer text-base leading-none p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors hover:opacity-80 font-sans"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </>
  );
}
