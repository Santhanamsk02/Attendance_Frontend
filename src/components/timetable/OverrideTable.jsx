import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { OVERRIDE_TYPES } from "../../utils/constants";

export default function OverrideTable({ overrides, onEdit, onDelete }) {
    if (overrides.length === 0) {
        return (
            <div className="neu-card p-12 text-center rounded-3xl animate-fade-in">
                <h3 className="text-xl font-black text-slate-700 mb-2">No Overrides Found</h3>
                <p className="text-[15px] font-semibold text-slate-500">
                    You haven't configured any date overrides yet. Switch to calendar view or click "Add Override" to start.
                </p>
            </div>
        );
    }

    // Sort overrides ascending by date
    const sorted = [...overrides].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="neu-card rounded-2xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Details</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-[15px] font-semibold text-slate-700">
                        {sorted.map((item) => {
                            const typeLabel = OVERRIDE_TYPES.find(t => t.value === item.type)?.label || item.type;

                            // Format date nicely
                            const dateObj = new Date(item.date);
                            const dayStr = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: "UTC" }); // using UTC since YYYY-MM-DD input parses to UTC midnight

                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="border-r border-slate-200">
                                        {dayStr}
                                    </td>
                                    <td className="border-r border-slate-200">
                                        <span className="font-bold text-slate-800">{typeLabel}</span>
                                    </td>
                                    <td className="border-r border-slate-200 font-medium">
                                        {item.description || "-"}
                                    </td>
                                    <td className="border-r border-slate-200 text-[13px]">
                                        {item.type === "SPECIAL_WORKING_DAY" && `Follows ${item.sourceDay} timetable`}
                                        {item.type === "HALF_DAY" && `Time: ${item.halfDayType}`}
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
