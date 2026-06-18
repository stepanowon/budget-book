import type { ReactNode } from 'react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <>
      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-12) var(--space-6);
          text-align: center;
          color: var(--color-text-secondary);
        }
        .empty-state__icon {
          font-size: 48px;
          line-height: 1;
          color: var(--color-border);
        }
        .empty-state__title {
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .empty-state__desc {
          font-size: 14px;
          margin: 0;
          max-width: 320px;
        }
        .empty-state__action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 24px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--border-radius);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
        }
        .empty-state__action:hover {
          background: var(--color-primary-dark);
        }
      `}</style>
      <div className="empty-state">
        {icon && <span className="empty-state__icon" aria-hidden="true">{icon}</span>}
        <p className="empty-state__title">{title}</p>
        {description && <p className="empty-state__desc">{description}</p>}
        {action && (
          <button className="empty-state__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </>
  );
}
