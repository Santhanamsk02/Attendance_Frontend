import React from "react";
import { Users, Plus, Upload } from "lucide-react";

export default function EmptyState({
  title = "No students found",
  description = "Add your first student or import students using a CSV/XLSX file to get started.",
  onAdd,
  onImport,
  hasFilters = false,
  onResetFilters,
  addLabel = "Add Student",
  importLabel = "Import Students",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3.5 shadow-2xs">
        <Users className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed font-normal">
        {hasFilters
          ? "No student records match the active search and filter criteria. Try adjusting or clearing your filters."
          : description}
      </p>

      {hasFilters ? (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors"
        >
          Reset All Filters
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              {importLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
