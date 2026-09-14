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
            <div className="flex items-center gap-3 px-5 py-3 rounded-3xl bg-white text-slate-800 neu-card shadow-[0_10px_30px_rgba(166,185,210,0.5)] border border-white">
                {/* Selected Counter Pill */}
                <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-500 text-[11px] font-black px-1.5 text-white shadow-[0_2px_6px_rgba(139,92,246,0.4)]">
                        {selectedCount}
                    </span>
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        {selectedCount === 1 ? "subject selected" : "subjects selected"}
                    </span>
                </div>

                {/* Clear selection */}
                <button
                    onClick={onClearSelection}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl neu-btn"
                    title="Clear Selection"
                >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">Deselect</span>
                </button>

                {/* Bulk Delete Action Button */}
                <button
                    onClick={onBulkDelete}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl neu-btn-danger text-xs font-bold disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedCount})</span>
                </button>
            </div>
        </div>
    );
}
