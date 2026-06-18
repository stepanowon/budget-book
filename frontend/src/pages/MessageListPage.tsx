import { useMessages } from '@/hooks/useMessages';
import { formatDisplayDate } from '@/utils/dateUtils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function MessageListPage() {
  const { data: messages = [], isLoading } = useMessages();

  return (
    <>
      <style>{`
        .message-list-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .message-list-page__title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        .message-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .message-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-4);
        }
        .message-card__content {
          font-size: 14px;
          color: var(--color-text-primary);
          white-space: pre-line;
          line-height: 1.6;
        }
        .message-card__meta {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: var(--space-2);
        }
        .message-list-page__loading {
          display: flex;
          justify-content: center;
          padding: var(--space-8);
        }
      `}</style>
      <div className="message-list-page">
        <h1 className="message-list-page__title">메시지</h1>
        {isLoading ? (
          <div className="message-list-page__loading">
            <LoadingSpinner />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title="메시지가 없습니다" description="정산 후 메시지가 생성됩니다." />
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div key={msg.id} className="message-card">
                <div className="message-card__content">{msg.content}</div>
                <div className="message-card__meta">
                  기간: {formatDisplayDate(msg.period_start)} ~ {formatDisplayDate(msg.period_end)}
                  {' · '}
                  {new Date(msg.sent_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

