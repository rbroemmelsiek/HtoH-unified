import React from 'react';

interface PaginatedListProps<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export function PaginatedList<T>({
  items,
  page,
  totalPages,
  totalItems,
  onPageChange,
  renderItem,
  emptyMessage = 'No matching records.',
}: PaginatedListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <div key={idx}>{renderItem(item, idx)}</div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{totalItems} items</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-gray-600 px-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
