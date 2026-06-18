import type { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
}: TableProps<T>) {
  return (
    <>
      <style>{`
        .table-wrapper { width: 100%; overflow-x: auto; }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          background: var(--color-surface);
          border-radius: var(--border-radius);
          overflow: hidden;
        }
        .table th {
          text-align: left;
          padding: var(--space-3) var(--space-4);
          background: var(--color-background);
          color: var(--color-text-secondary);
          font-weight: 500;
          font-size: 12px;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-primary);
          vertical-align: middle;
        }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover td { background: var(--color-background); }
        .table-loading, .table-empty {
          text-align: center;
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }
      `}</style>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="table-loading">
                  <LoadingSpinner size="md" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
