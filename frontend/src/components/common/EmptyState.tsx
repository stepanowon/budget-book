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
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center text-neutral">
      {icon && <span className="text-5xl leading-none text-border" aria-hidden="true">{icon}</span>}
      <p className="text-lg font-medium text-[#202124] m-0">{title}</p>
      {description && <p className="text-sm m-0 max-w-[320px]">{description}</p>}
      {action && (
        <button
          className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-dark transition-colors"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
