import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // 모달 열릴 때 첫 번째 포커스 가능한 요소에 포커스
      setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        focusable?.[0]?.focus();
      }, 0);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .modal-dialog {
          background: var(--color-surface);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,.2);
          min-width: 320px;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6) var(--space-6) var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-neutral);
          font-size: 20px;
          line-height: 1;
          padding: var(--space-2);
          border-radius: var(--border-radius);
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover { background: var(--color-background); }
        .modal-body { padding: var(--space-6); overflow-y: auto; flex: 1; }
        .modal-footer {
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
        }
      `}</style>
      <div
        className="modal-backdrop"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          className="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {(title !== undefined) && (
            <div className="modal-header">
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </>,
    document.body,
  );
}
