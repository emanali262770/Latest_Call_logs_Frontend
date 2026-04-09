import { ChevronLeft, ChevronRight } from 'lucide-react';

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalizedPages = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result = [];

  normalizedPages.forEach((page, index) => {
    const previousPage = normalizedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      result.push(`ellipsis-${previousPage}-${page}`);
    }
    result.push(page);
  });

  return result;
}

export default function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-900">{startItem}</span> to{' '}
          <span className="font-bold text-gray-900">{endItem}</span> of{' '}
          <span className="font-bold text-gray-900">{totalItems}</span> {itemLabel}
        </p>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-brand/20 hover:bg-brand-light/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="px-2 text-sm font-medium text-gray-300">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all ${
                  item === currentPage
                    ? 'bg-brand-light text-brand shadow-sm'
                    : 'border border-transparent bg-white text-gray-500 hover:border-brand/20 hover:bg-brand-light/40 hover:text-brand'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-brand/20 hover:bg-brand-light/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
