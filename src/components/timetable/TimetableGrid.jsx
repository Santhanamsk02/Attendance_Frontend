import React from "react";
import { DAYS } from "../../utils/constants";
import TimetableCell from "./TimetableCell";

export default function TimetableGrid({
    timeline,
    days,
    getEntryForCell,
    calculateGridSpan,
    onAssignCell,
    onEditCell,
    onDropCell,   // (dayValue, item, dragPayload) => void
    readOnly = false,
    colorByKey = "subject_code",
}) {
    // Total columns = day label + timeline items
    const colCount = timeline.length + 1;
    const periods = timeline.filter((i) => i.type === "period");

    return (
        <div className="rounded-3xl overflow-hidden" style={{
            boxShadow: "0 4px 32px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(226,232,240,0.6)",
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(16px)",
        }}>
            <div className="overflow-x-auto">
                <div
                    className="min-w-[700px] p-2 bg-slate-50/50"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `80px repeat(${timeline.length}, minmax(90px, 1fr))`,
                        gap: "6px"
                    }}
                >
                    {/* ── Header Row ───────────────────────────── */}
                    {/* Corner cell */}
                    <div className="tt-header-day sticky left-0 z-10 flex items-center justify-center px-3 py-4 border border-slate-200/60 rounded-xl"
                        style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Day</span>
                    </div>

                    {/* Period / break header cells */}
                    {timeline.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`flex flex-col items-center justify-center px-1 py-3 border rounded-xl text-center
                                ${item.type === "break"
                                    ? "bg-amber-50/80 border-amber-200"
                                    : "border-slate-200/60"}`}
                            style={item.type !== "break" ? {
                                background: "linear-gradient(180deg, rgba(238,242,255,0.9) 0%, rgba(248,250,252,0.8) 100%)",
                            } : {}}
                        >
                            {item.type === "break" ? (
                                <>
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[9px] font-semibold text-amber-500/70 mt-0.5">{item.start}–{item.end}</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center mb-1 shadow-sm shadow-indigo-200">
                                        <span className="text-[9px] font-black text-white">{item.number || (idx + 1)}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700 leading-none">{item.label}</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">{item.start}–{item.end}</span>
                                </>
                            )}
                        </div>
                    ))}

                    {/* ── Day Rows ─────────────────────────────── */}

                    {DAYS.map((dayObj) => {
                        const dayValue = dayObj.value;
                        // Build cells, skipping over spanned slots
                        const cells = [];
                        let skipUntilIdx = -1;

                        timeline.forEach((item, colIdx) => {
                            if (colIdx <= skipUntilIdx) return; // skip (spanned)

                            if (item.type === "break") {
                                cells.push(
                                    <TimetableCell
                                        key={`${dayValue}-${item.id}`}
                                        item={item}
                                        dayValue={dayValue}
                                        entry={null}
                                        onAssign={onAssignCell}
                                        onEdit={onEditCell}
                                        readOnly={readOnly}
                                        colorByKey={colorByKey}
                                    />
                                );
                                return;
                            }

                            const entry = getEntryForCell(dayValue, item.id);

                            if (entry && entry._isSpanned) {
                                // This period is inside a span — skip rendering
                                return;
                            }

                            if (entry && entry.span > 1) {
                                const gridSpan = calculateGridSpan(entry);
                                // Annotate start/end period numbers for display
                                const startP = periods.find((p) => p.id === entry.start_timeline_item_id);
                                const endP = periods.find((p) => p.id === entry.end_timeline_item_id);
                                const enrichedEntry = {
                                    ...entry,
                                    _startNum: startP?.number,
                                    _endNum: endP?.number,
                                };
                                // Need to skip subsequent columns in this span
                                const startTimelineIdx = colIdx;
                                const endTimelineIdx = timeline.findIndex((i) => i.id === entry.end_timeline_item_id);
                                skipUntilIdx = endTimelineIdx;

                                cells.push(
                                    <TimetableCell
                                        key={`${dayValue}-${item.id}`}
                                        item={item}
                                        dayValue={dayValue}
                                        entry={enrichedEntry}
                                        gridSpan={gridSpan}
                                        onAssign={onAssignCell}
                                        onEdit={onEditCell}
                                        onDrop={onDropCell}
                                        readOnly={readOnly}
                                        colorByKey={colorByKey}
                                    />
                                );
                                return;
                            }

                            cells.push(
                                <TimetableCell
                                    key={`${dayValue}-${item.id}`}
                                    item={item}
                                    dayValue={dayValue}
                                    entry={entry}
                                    onAssign={onAssignCell}
                                    onEdit={onEditCell}
                                    onDrop={onDropCell}
                                    readOnly={readOnly}
                                    colorByKey={colorByKey}
                                />
                            );
                        });

                        return (
                            <React.Fragment key={dayValue}>
                                {/* Day label — premium colored pill */}
                                <div
                                    className="tt-header-day sticky left-0 z-10 flex items-center justify-center p-2 border border-slate-200/50 rounded-xl"
                                    style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                                            <span className="text-[10px] font-black text-white tracking-wide">
                                                {dayObj.label.slice(0, 3).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {cells}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
