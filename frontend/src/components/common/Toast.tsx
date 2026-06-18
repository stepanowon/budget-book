import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const typeStyles: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'var(--color-success-light)', border: 'var(--color-success)', color: 'var(--color-success)' },
  error:   { bg: 'var(--color-danger-light)',  border: 'var(--color-danger)',  color: 'var(--color-danger)'  },
  info:    { bg: 'var(--color-primary-light)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
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

  const { bg, border, color } = typeStyles[type];

  return (
    <>
      <style>{`
        .toast {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--border-radius);
          border: 1px solid;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
          font-size: 14px;
          z-index: 2000;
          min-width: 240px;
          max-width: 400px;
          animation: toast-in 0.2s ease;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: var(--space-1);
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius);
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="toast"
        style={{ background: bg, borderColor: border, color }}
      >
        <span>{message}</span>
        <button
          className="toast-close"
          onClick={onClose}
          aria-label="닫기"
          style={{ color }}
        >
          ✕
        </button>
      </div>
    </>
  );
}
