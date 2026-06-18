import { useMessages } from '@/hooks/useMessages';
import { formatDisplayDate } from '@/utils/dateUtils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function MessageListPage() {
  const { data: messages = [], isLoading } = useMessages();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#202124] m-0">메시지</h1>
      {isLoading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState title="메시지가 없습니다" description="정산 후 메시지가 생성됩니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white border border-border rounded p-4">
              <div className="text-sm text-[#202124] whitespace-pre-line leading-relaxed">{msg.content}</div>
              <div className="text-xs text-neutral mt-2">
                기간: {formatDisplayDate(msg.period_start)} ~ {formatDisplayDate(msg.period_end)}
                {' · '}
                {new Date(msg.sent_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

