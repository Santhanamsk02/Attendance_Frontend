import React from "react";
import { Plus, Clock, Coffee, Pencil, Trash2 } from "lucide-react";

export default function TimelineConfig({
    timeline,
    onEditPeriod,
    onRemovePeriod,
    onAddPeriod,
    onEditBreak,
    onRemoveBreak,
    onAddBreak,
    includeSaturday,
    onToggleSaturday,
}) {
    return (
        <div className="rounded-3xl neu-card p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-slate-100/80 gap-3">
                <h3 className="text-[16px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Timeline Configuration
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={onToggleSaturday}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-[14px] font-bold rounded-xl transition-colors border ${includeSaturday
                                ? "bg-slate-700 text-white border-slate-700 hover:bg-slate-600"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        {includeSaturday ? "Working Saturday" : "Off Saturday"}
                    </button>
                    <button
                        onClick={onAddPeriod}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-indigo-600 neu-btn rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        Period
                    </button>
                    <button
                        onClick={onAddBreak}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-amber-600 neu-btn rounded-xl"
                    >
                        <Coffee className="w-4 h-4" />
                        Break
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
                {timeline.map((item) => (
                    <div
                        key={item.id}
                        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${item.type === "break"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-50 text-slate-700 border border-slate-100"
                            }`}
                    >
                        {item.type === "break" ? (
                            <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}

                        <span className="font-bold">{item.label}</span>
                        <span className="text-[13px] opacity-70 border-l border-current pl-2 ml-1">
                            {item.start} – {item.end}
                        </span>

                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                            <button
                                onClick={() =>
                                    item.type === "break"
                                        ? onEditBreak(item)
                                        : onEditPeriod(item)
                                }
                                className="p-1 rounded-lg hover:bg-white/80 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Edit"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() =>
                                    item.type === "break"
                                        ? onRemoveBreak(item.id)
                                        : onRemovePeriod(item.id)
                                }
                                className="p-1 rounded-lg hover:bg-white/80 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Remove"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
