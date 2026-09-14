import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  isLoading = false,
  itemName = "students",
}) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-7 py-5 border-t border-slate-100 bg-[#f8fbfe] rounded-b-3xl">
      <div className="text-xs sm:text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-800">{start}</span> to{" "}
        <span className="font-bold text-slate-800">{end}</span> of{" "}
        <span className="font-bold text-slate-800">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="flex items-center justify-center p-2 rounded-xl neu-btn text-slate-600 hover:text-sky-600 disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-bold">
              •••
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className={`min-w-[34px] h-8.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${currentPage === page
                  ? "neu-btn-primary"
                  : "neu-btn text-slate-600 hover:text-sky-600"
                }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="flex items-center justify-center p-2 rounded-xl neu-btn text-slate-600 hover:text-sky-600 disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
