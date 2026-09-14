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
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl neu-icon-well text-sky-600 mb-4 shadow-[4px_4px_10px_rgba(166,185,210,0.35),-4px_-4px_10px_rgba(255,255,255,0.95)]">
        <Users className="h-8 w-8" />
      </div>
      <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed font-medium">
        {hasFilters
          ? "No student records match the active search and filter criteria. Try adjusting or clearing your filters."
          : description}
      </p>

      {hasFilters ? (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-sky-700 neu-badge-blue rounded-2xl transition-all hover:brightness-95"
        >
          Reset All Filters
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold neu-btn-primary rounded-2xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 neu-btn rounded-2xl"
            >
              <Upload className="w-4 h-4 text-sky-600" />
              {importLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
