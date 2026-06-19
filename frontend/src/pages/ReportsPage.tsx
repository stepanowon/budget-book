import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGroups } from '@/hooks/useGroups';
import * as reportApi from '@/api/reportApi';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import MemberPieChart from '@/components/charts/MemberPieChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [groupId, setGroupId] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: groups = [] } = useGroups();

  const params = { date_from: dateFrom, date_to: dateTo };
  const enabled = Boolean(groupId) && Boolean(dateFrom) && Boolean(dateTo);

  const {
    data: categoryData = [],
    isLoading: isLoadingCat,
    isError: isErrorCat,
  } = useQuery({
    queryKey: ['reports', 'categories', groupId, params],
    queryFn: () => reportApi.getCategoryReport(groupId, params),
    enabled,
  });

  const {
    data: memberData = [],
    isLoading: isLoadingMember,
    isError: isErrorMember,
  } = useQuery({
    queryKey: ['reports', 'members', groupId, params],
    queryFn: () => reportApi.getMemberReport(groupId, params),
    enabled,
  });

  const isLoading = isLoadingCat || isLoadingMember;

  async function handleExportPdf() {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const groupName = groups.find((g) => g.id === groupId)?.name ?? '리포트';
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let remaining = imgHeight;
      let firstPage = true;

      while (remaining > 0) {
        const sliceHeight = Math.min(remaining, pageHeight - 20);
        const sliceRatio = sliceHeight / imgHeight;
        const srcY = ((imgHeight - remaining) / imgHeight) * canvas.height;
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = canvas.height * sliceRatio;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        if (!firstPage) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, sliceHeight);
        remaining -= sliceHeight;
        firstPage = false;
      }

      pdf.save(`${groupName}_${dateFrom}_${dateTo}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  const filterControlClass =
    'px-3 py-2 border border-border rounded text-sm min-h-[44px] font-sans text-[#202124] bg-white outline-none focus:border-primary transition-colors';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#202124] m-0">리포트</h1>

      <div className="flex gap-4 flex-wrap items-end bg-white border border-border rounded p-4" style={{ printColorAdjust: 'exact' }}>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-neutral" htmlFor="rp-group">그룹</label>
          <select
            id="rp-group"
            className={filterControlClass}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">그룹 선택</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-neutral" htmlFor="rp-from">시작일</label>
          <input
            id="rp-from"
            className={filterControlClass}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-neutral" htmlFor="rp-to">종료일</label>
          <input
            id="rp-to"
            className={filterControlClass}
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {!isLoading && categoryData.length > 0 && (
          <Button variant="outlined" size="sm" onClick={() => void handleExportPdf()} loading={isExportingPdf}>
            PDF 내보내기
          </Button>
        )}
      </div>

      {!groupId ? (
        <EmptyState title="그룹을 선택하세요" description="리포트를 볼 그룹을 선택해 주세요." />
      ) : isLoading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : isErrorCat || isErrorMember ? (
        <p className="text-danger text-sm p-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
      ) : categoryData.length === 0 && memberData.length === 0 ? (
        <EmptyState title="해당 기간에 지출 데이터가 없습니다" />
      ) : (
        <div ref={reportRef} className="flex flex-col gap-4 bg-[#f8f9fa] rounded p-4">
          <div className="text-center py-2">
            <p className="text-lg font-semibold text-[#202124] m-0">
              {groups.find((g) => g.id === groupId)?.name} 지출 리포트
            </p>
            <p className="text-sm text-neutral m-0 mt-1">기간: {dateFrom} ~ {dateTo}</p>
          </div>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {categoryData.length > 0 && (
              <div className="bg-white border border-border rounded p-6">
                <CategoryPieChart data={categoryData} />
              </div>
            )}
            {memberData.length > 0 && (
              <div className="bg-white border border-border rounded p-6">
                <MemberPieChart data={memberData} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
