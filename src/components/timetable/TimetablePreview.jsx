import React from "react";
import { X, Printer } from "lucide-react";
import { DAYS, DEPARTMENTS } from "../../utils/constants";

export default function TimetablePreview({
    isOpen,
    onClose,
    context,
    timeline,
    days,
    getEntryForCell,
    calculateGridSpan,
}) {
    if (!isOpen) return null;

    const deptLabel =
        DEPARTMENTS.find((d) => d.value === context.department)?.label ||
        context.department;
    const periods = timeline.filter((i) => i.type === "period");

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print:static print:overflow-visible">
            {/* Toolbar — hidden during print */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 print:hidden">
                <h2 className="text-sm font-black text-slate-800">Timetable Preview</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 neu-btn rounded-xl"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 neu-btn"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Preview content */}
            <div className="bg-white p-12 max-w-[1400px] mx-auto min-h-screen text-slate-800 animate-fade-in shadow-2xl neu-card">
                <div className="text-center mb-10 pb-6 border-b-2 border-slate-200">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                        Panimalar Engineering College
                    </h1>
                    <h2 className="text-2xl font-bold text-slate-700 mt-3 uppercase tracking-wider">
                        Department of {context.department?.toUpperCase() || "N/A"}
                    </h2>
                    <h3 className="text-xl font-semibold text-slate-600 mt-2">
                        Academic Year {context.academic_year || "N/A"} &nbsp;|&nbsp; Semester {context.semester || "N/A"} &nbsp;|&nbsp; Section {context.section || "N/A"}
                    </h3>
                </div>

                {/* Timetable Grid */}
                <div className="border-l-2 border-b-2 border-slate-200" style={{ display: 'grid', gridTemplateColumns: `120px repeat(${timeline.length}, minmax(0, 1fr))` }}>
                    <div className="py-4 border-r-2 border-slate-200 flex items-center justify-center font-black tracking-widest uppercase text-slate-500 text-[14px]">
                        DAY
                    </div>
                    {timeline.map((item) => (
                        <div key={item.id} className="py-4 border-r-2 border-slate-200 flex flex-col items-center justify-center text-center px-4">
                            <span className={`text-[12px] font-black uppercase tracking-wider ${item.type === "break" ? "text-amber-700" : "text-slate-800"}`}>
                                {item.label}
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 ${item.type === "break" ? "text-amber-600" : "text-slate-500"}`}>
                                {item.start}–{item.end}
                            </span>
                        </div>
                    ))}

                    {days.map((dayObj) => {
                        const dayValue = dayObj.day || dayObj.value;
                        const cells = [];
                        let skipCols = 0;

                        for (let i = 0; i < timeline.length; i++) {
                            if (skipCols > 0) {
                                skipCols--;
                                continue;
                            }

                            const item = timeline[i];
                            if (item.type === "break") {
                                cells.push(
                                    <div key={`${dayValue}-${item.id}`} className="min-h-[120px] p-4 text-center flex flex-col justify-center items-center select-none" style={{ gridColumn: `span 1` }}>
                                        <span className="text-[13px] font-black uppercase text-amber-700 tracking-wider">Break</span>
                                        <span className="text-[11px] font-bold text-amber-600 mt-1.5">{item.label}</span>
                                    </div>
                                );
                                continue;
                            }

                            const entry = getEntryForCell(dayValue, item.id);

                            if (entry) {
                                if (entry._isSpanned) continue;
                                const gridSpan = calculateGridSpan(entry);
                                skipCols = gridSpan > 1 ? gridSpan - 1 : 0;
                                cells.push(
                                    <div key={`${dayValue}-${item.id}`} className="min-h-[120px] p-4 flex flex-col justify-center bg-indigo-50/20" style={{ gridColumn: `span ${gridSpan}` }}>
                                        <span className="text-[15px] font-black text-indigo-900 leading-tight text-center">
                                            {entry.subject_code}
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-800 leading-tight mt-1.5 text-center">
                                            {entry.subject_name}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-600 mt-1 block text-center">
                                            {entry.teacher_name}
                                        </span>
                                        {entry.room && (
                                            <span className="text-[10px] text-slate-500 block text-center">
                                                {entry.room}
                                            </span>
                                        )}
                                    </div>
                                );
                            } else {
                                cells.push(
                                    <div key={`${dayValue}-${item.id}`} className="min-h-[120px]" style={{ gridColumn: `span 1` }}></div>
                                );
                            }
                        }

                        return (
                            <React.Fragment key={dayValue}>
                                <div className="flex items-center justify-center py-4 font-black text-[16px] text-slate-800 uppercase tracking-widest bg-slate-50 border-r-2 border-t-2 border-slate-200">
                                    {(dayObj.label || dayObj.day).slice(0, 3)}
                                </div>
                                {React.Children.map(cells, (child) =>
                                    React.cloneElement(child, {
                                        className: `${child.props.className} border-r-2 border-t-2 border-slate-200`,
                                    })
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="mt-8 pt-4 flex justify-between items-center text-[13px] font-semibold text-slate-500 italic print:flex">
                    <span>Generated by System</span>
                    <span>{new Date().toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
