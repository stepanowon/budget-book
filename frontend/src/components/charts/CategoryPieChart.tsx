import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { ReportCategoryResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatCurrency';

const COLORS = [
  '#039be5',
  '#33b679',
  '#8e24aa',
  '#f6bf26',
  '#d81b60',
  '#616161',
  '#1a73e8',
  '#f4511e',
];

interface CategoryPieChartProps {
  data: ReportCategoryResponse[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.category_name,
    value: d.total,
  }));

  return (
    <>
      <style>{`
        .pie-chart-section { display: flex; flex-direction: column; gap: var(--space-4); }
        .pie-chart-section__title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        .pie-chart-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .pie-chart-table th {
          text-align: left;
          padding: var(--space-2) var(--space-3);
          background: var(--color-background);
          color: var(--color-text-secondary);
          font-size: 12px;
          border-bottom: 1px solid var(--color-border);
        }
        .pie-chart-table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-primary);
        }
        .pie-chart-table tr:last-child td { border-bottom: none; }
      `}</style>
      <div className="pie-chart-section">
        <h3 className="pie-chart-section__title">카테고리별 지출</h3>
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
                  key={`cat-cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <table className="pie-chart-table" aria-label="카테고리별 지출 데이터">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.category_id}>
                <td>{d.category_name}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(d.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
