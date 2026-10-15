import React from "react";
import { Trash2, X } from "lucide-react";

export default function BulkActionBar({
    selectedCount,
    onClearSelection,
    onBulkDelete,
    isLoading = false,
}) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40 w-auto max-w-lg animate-fade-in">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800">
                {/* Selected Counter Pill */}
                <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold px-1.5 text-white">
                        {selectedCount}
                    </span>
                    <span className="text-xs font-medium text-slate-200 whitespace-nowrap">
                        {selectedCount === 1 ? "subject selected" : "subjects selected"}
                    </span>
                </div>

                {/* Clear selection */}
                <button
                    onClick={onClearSelection}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
                    title="Clear Selection"
                >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">Deselect</span>
                </button>

                {/* Bulk Delete Action Button */}
                <button
                    onClick={onBulkDelete}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedCount})</span>
                </button>
            </div>
        </div>
    );
}
