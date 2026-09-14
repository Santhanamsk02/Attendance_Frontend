import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Edit, Trash2, Plus } from "lucide-react";
import { OVERRIDE_TYPES } from "../../utils/constants";

const getBadgeColors = (type) => {
    switch (type) {
        case "HOLIDAY": return "bg-rose-100 text-rose-700 border-rose-200";
        case "SPECIAL_WORKING_DAY": return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "HALF_DAY": return "bg-amber-100 text-amber-700 border-amber-200";
        case "SPECIAL_CLASS": return "bg-violet-100 text-violet-700 border-violet-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

export default function OverrideCalendar({ overrides, onSelectDate, onEditOverride, onDeleteOverride }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

    const renderCells = () => {
        const cells = [];
        const todayStr = new Date().toISOString().split("T")[0];

        // Padding cells
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`pad-${i}`} className="min-h-[100px] bg-slate-50/50 border-r border-b border-slate-200/60 p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            // Format YYYY-MM-DD correctly
            const dateObj = new Date(year, month, day);
            // Using local format fix avoiding UTC offset issues
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

            const isToday = dateStr === todayStr;
            const override = overrides.find((o) => o.date === dateStr);
            const typeLabel = override ? (OVERRIDE_TYPES.find(t => t.value === override.type)?.label || override.type) : "";

            cells.push(
                <div
                    key={dateStr}
                    onClick={() => onSelectDate(dateStr)}
                    className={`min-h-[120px] p-2 border-r border-b border-slate-200/60 cursor-pointer transition-all hover:bg-indigo-50 relative group ${isToday ? "bg-indigo-50/30" : "bg-white"}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[15px] font-bold ${isToday ? "w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center -mt-1 -ml-1 shadow-md shadow-indigo-500/30" : "text-slate-700 ml-1 mt-1"}`}>
                            {day}
                        </span>
                        {override && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex bg-white rounded-lg shadow-sm ring-1 ring-slate-200">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditOverride(override); }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <div className="bg-slate-200 w-px my-1" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteOverride(override.id); }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {override && (
                        <div className="px-1 mt-1 animate-fade-in text-left">
                            <div className={`px-2 py-1 rounded border text-[11px] font-black uppercase tracking-wider mb-1 block w-max max-w-full truncate ${getBadgeColors(override.type)}`}>
                                {typeLabel}
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 line-clamp-2 leading-tight">
                                {override.description || "No description"}
                            </p>
                        </div>
                    )}

                    {!override && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 font-bold text-[13px]">
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </div>
                    )}
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="neu-card rounded-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100/80 bg-slate-50">
                <h3 className="text-xl font-black text-slate-800">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 bg-white rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all text-slate-600 border border-slate-200">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 bg-white rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all text-slate-600 border border-slate-200">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200/60 bg-slate-100/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-3 text-center text-[13px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200/60">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {renderCells()}
            </div>
        </div>
    );
}
