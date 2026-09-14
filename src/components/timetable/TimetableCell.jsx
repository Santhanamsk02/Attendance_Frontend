import React, { useState } from "react";
import { Plus } from "lucide-react";
import { getSubjectPalette } from "../../utils/subjectColors";

export default function TimetableCell({
    item,
    dayValue,
    entry,
    onAssign,
    onEdit,
    onDrop,
    gridSpan = 1,
    readOnly = false,
    colorByKey = "subject_code",
}) {
    const [dragOver, setDragOver] = useState(false);

    const handleDragOver = (e) => {
        if (readOnly || item.type === "break") return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
    };
    const handleDragLeave = () => setDragOver(false);
    const handleDrop = (e) => {
        setDragOver(false);
        if (readOnly || item.type === "break") return;
        try {
            const payload = JSON.parse(e.dataTransfer.getData("application/json"));
            if (payload && onDrop) onDrop(dayValue, item, payload);
        } catch { /* ignore */ }
    };

    // ── Break ──────────────────────────────────────────────────────────────
    if (item.type === "break") {
        return (
            <div
                className="tt-cell-break flex flex-col items-center justify-center text-center px-2 py-3 select-none"
                style={{ gridColumn: `span 1` }}
            >
                <span className="text-[10px] font-black text-amber-600 uppercase leading-tight tracking-widest">
                    {item.label}
                </span>
                <span className="text-[9px] font-semibold text-amber-500/70 mt-1">
                    {item.start}–{item.end}
                </span>
            </div>
        );
    }

    if (entry && entry._isSpanned) return null;

    // ── Assigned cell ──────────────────────────────────────────────────────
    if (entry && !entry._isSpanned) {
        const hashKey = entry[colorByKey] || entry.subject_code || "";
        const pal = getSubjectPalette(hashKey);
        const isLab = entry.span > 1;
        const initials = (entry.teacher_name || "?")
            .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

        return (
            <div
                className={`tt-cell-assigned group transition-all
                    ${!readOnly ? "cursor-pointer" : ""}
                    ${dragOver ? "ring-2 ring-inset brightness-95 scale-[0.98]" : ""}`}
                style={{
                    gridColumn: `span ${gridSpan}`,
                    border: `1px solid ${pal.accent}`,
                    background: dragOver
                        ? "rgba(224,231,255,0.9)"
                        : `linear-gradient(135deg, ${pal.cellBg} 0%, rgba(255,255,255,0.75) 100%)`,
                    textAlign: "center",
                    alignItems: "center",
                }}
                onClick={() => !readOnly && onEdit(dayValue, entry)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title="Click to edit · Drop to replace"
            >
                {/* Type badge */}
                <div className="flex items-center justify-center mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${pal.badge}`}>
                        {isLab ? `Lab ×${entry.span}` : (entry.session_type || "theory")}
                    </span>
                </div>

                {/* Subject name */}
                <span className={`text-[12px] font-black leading-tight block truncate ${pal.text}`}>
                    {entry.subject_name}
                </span>

                {/* Subject code */}
                <span className="text-[10px] font-semibold text-slate-600 leading-tight block truncate mt-0.5">
                    {entry.subject_code}
                </span>

                {/* Teacher name not displayed as requested */}

                {/* Room / Section chip */}
                {(entry.room || entry.section) && (
                    <div className="flex justify-center mt-1.5 gap-1">
                        {entry.section && (
                            <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200/60 text-[12px] font-bold text-slate-500">
                                class: <span className="text-slate-800">{entry.section}</span>
                            </span>
                        )}
                        {entry.room && (
                            <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200/60 text-[9px] font-bold text-slate-500">
                                {entry.room}
                            </span>
                        )}
                    </div>
                )}

                {/* Hover overlay */}
                {!readOnly && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-[1px] rounded">
                        <span className="text-[10px] font-black text-slate-700 bg-white/90 px-2 py-0.5 rounded-full shadow">
                            ✏ Edit
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // ── Empty cell ─────────────────────────────────────────────────────────
    if (readOnly) {
        return (
            <div
                className="tt-cell-empty flex items-center justify-center"
                style={{ gridColumn: `span 1` }}
            >
                <span className="text-[20px] font-light text-slate-200">—</span>
            </div>
        );
    }

    return (
        <div
            className={`tt-cell-empty group cursor-pointer ${dragOver ? "tt-cell-drop-active" : ""}`}
            style={{ gridColumn: `span 1` }}
            onClick={() => onAssign(dayValue, item)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {dragOver ? (
                <div className="flex flex-col items-center gap-1 animate-fade-in z-10 relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Plus className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600">Drop here</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-1 z-10 relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span className="text-[9px] font-bold text-slate-400">Assign</span>
                </div>
            )}
        </div>
    );
}
