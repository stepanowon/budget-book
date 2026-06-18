import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { ReportMemberResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatCurrency';

const COLORS = [
  '#1a73e8',
  '#34a853',
  '#fbbc04',
  '#ea4335',
  '#9334e6',
  '#24c1e0',
];

interface MemberPieChartProps {
  data: ReportMemberResponse[];
}

export default function MemberPieChart({ data }: MemberPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.username,
    value: d.total_share,
  }));

  return (
    <>
      <style>{`
        .member-pie-chart-section { display: flex; flex-direction: column; gap: var(--space-4); }
        .member-pie-chart-section__title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        .member-pie-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .member-pie-table th {
          text-align: left;
          padding: var(--space-2) var(--space-3);
          background: var(--color-background);
          color: var(--color-text-secondary);
          font-size: 12px;
          border-bottom: 1px solid var(--color-border);
        }
        .member-pie-table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-primary);
        }
        .member-pie-table tr:last-child td { border-bottom: none; }
      `}</style>
      <div className="member-pie-chart-section">
        <h3 className="member-pie-chart-section__title">멤버별 지출 분담</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }: PieLabelRenderProps) =>
                `${name ?? ''} ${formatCurrency(Number(value ?? 0))}`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`member-cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <table className="member-pie-table" aria-label="멤버별 지출 분담 데이터">
          <thead>
            <tr>
              <th>멤버</th>
              <th>분담액</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.user_id}>
                <td>{d.username}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(d.total_share)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
