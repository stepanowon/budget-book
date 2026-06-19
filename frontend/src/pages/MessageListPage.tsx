import { useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { formatDisplayDate } from '@/utils/dateUtils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const MSG_SEEN_KEY = 'msg_seen_count';

export default function MessageListPage() {
  const { data: messages = [], isLoading } = useMessages();

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(MSG_SEEN_KEY, String(messages.length));
    }
  }, [messages.length, isLoading]);

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
              <div className="text-sm text-[#202124] leading-relaxed">
                {msg.content.replace(/\s*\(기간:.*?\)\s*$/, '')}
              </div>
              <div className="text-xs text-neutral mt-2 flex flex-col gap-0.5">
                <span>기간: {formatDisplayDate(msg.period_start)} ~ {formatDisplayDate(msg.period_end)}</span>
                <span>정산일: {new Date(msg.sent_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

