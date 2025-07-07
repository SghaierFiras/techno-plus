import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Eye } from 'lucide-react';

interface UnifiedTableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  type?: 'string' | 'number' | 'date'; // for sorting
}

interface UnifiedTableProps<T> {
  columns: UnifiedTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  rowKey: (row: T) => string | number;
}

export function UnifiedTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found.',
  actions,
  rowKey,
}: UnifiedTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Column visibility state (persisted)
  const tableId = React.useMemo(() => {
    // Try to create a unique id for this table based on columns and rowKey
    const colKeys = columns.map(c => c.key).join(',');
    return `unified-table-cols:${colKeys}`;
  }, [columns]);
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(tableId);
      if (saved) return JSON.parse(saved);
    }
    return columns.map(c => c.key as string);
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(tableId, JSON.stringify(visibleCols));
    }
  }, [visibleCols, tableId]);

  // Find column type for sorting
  const getColType = (key: string): 'string' | 'number' | 'date' => {
    const col = columns.find(c => c.key === key);
    if (col && col.type) return col.type;
    // Guess type from first row
    const val = data[0]?.[key as keyof T];
    if (typeof val === 'number') return 'number';
    if (val instanceof Date) return 'date';
    if (typeof val === 'string' && !isNaN(Date.parse(val))) return 'date';
    return 'string';
  };

  // Sort data
  let sortedData = data;
  if (sortKey) {
    const colType = getColType(sortKey);
    sortedData = [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal: any = a[sortKey as keyof T];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal: any = b[sortKey as keyof T];
      if (colType === 'number') {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (colType === 'date') {
        const aDate = aVal instanceof Date ? aVal : new Date(aVal);
        const bDate = bVal instanceof Date ? bVal : new Date(bVal);
        return sortDir === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      }
      // string
      return sortDir === 'asc'
        ? String(aVal || '').localeCompare(String(bVal || ''))
        : String(bVal || '').localeCompare(String(aVal || ''));
    });
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Only show visible columns
  const visibleColumns = columns.filter(col => visibleCols.includes(col.key as string));

  return (
    <div className="bg-card border border-border shadow rounded-lg overflow-hidden dark:bg-card/80">
      <div className="w-full overflow-x-auto rounded-lg">
        <div className="flex justify-end items-center px-4 pt-4 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 px-2 py-1 rounded border bg-background hover:bg-accent text-sm font-medium shadow">
                <Eye className="w-4 h-4" />
                Columns
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.key as string}
                  checked={visibleCols.includes(col.key as string)}
                  onCheckedChange={checked => {
                    setVisibleCols(cols => {
                      if (checked) return [...cols, col.key as string];
                      return cols.filter(k => k !== col.key);
                    });
                  }}
                  disabled={visibleCols.length === 1 && visibleCols.includes(col.key as string)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <table className="min-w-[900px] w-full divide-y divide-border">
          <thead className="bg-primary dark:bg-sky-800">
            <tr>
              {visibleColumns.map(col => (
                <th
                  key={col.key as string}
                  className={`px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer select-none ${col.className || ''}`}
                  onClick={() => handleSort(col.key as string)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border dark:bg-background/80">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map(row => (
                <tr key={rowKey(row)} className="hover:bg-accent hover:text-accent-foreground transition-colors">
                  {visibleColumns.map(col => (
                    <td key={col.key as string} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 