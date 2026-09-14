import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, FileText } from "lucide-react";
import { OVERRIDE_TYPES, HALF_DAY_TYPES, DAYS } from "../../utils/constants";

export default function OverrideModal({ isOpen, initialData, defaultDate, onClose, onSave }) {
    const [formData, setFormData] = useState({
        date: defaultDate || new Date().toISOString().split("T")[0],
        type: "HOLIDAY",
        description: "",
        sourceDay: "MON",
        halfDayType: "MORNING",
    });

    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <CalendarIcon className="w-6 h-6 text-indigo-500" />
                        {initialData ? "Edit Date Override" : "Add Date Override"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm hover:shadow transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-[14px] font-bold text-slate-700 mb-2">Date *</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => handleChange("date", e.target.value)}
                            className="w-full neu-input rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-700 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-bold text-slate-700 mb-2">Override Type *</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => handleChange("type", e.target.value)}
                            className="w-full neu-input rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-700 focus:outline-none"
                        >
                            {OVERRIDE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.type === "SPECIAL_WORKING_DAY" && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <label className="block text-[14px] font-bold text-indigo-900 mb-2">Source Day Schedule *</label>
                            <select
                                required
                                value={formData.sourceDay}
                                onChange={(e) => handleChange("sourceDay", e.target.value)}
                                className="w-full bg-white rounded-lg px-4 py-2.5 text-[14px] font-semibold text-indigo-900 focus:outline-none border border-indigo-200"
                            >
                                {DAYS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-indigo-500 font-medium mt-2">
                                This date will copy the timetable configured for {DAYS.find(d => d.value === formData.sourceDay)?.label || "the selected day"}.
                            </p>
                        </div>
                    )}

                    {formData.type === "HALF_DAY" && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <label className="block text-[14px] font-bold text-amber-900 mb-2">Session *</label>
                            <select
                                required
                                value={formData.halfDayType}
                                onChange={(e) => handleChange("halfDayType", e.target.value)}
                                className="w-full bg-white rounded-lg px-4 py-2.5 text-[14px] font-semibold text-amber-900 focus:outline-none border border-amber-200"
                            >
                                {HALF_DAY_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-amber-600 font-medium mt-2">
                                Classes will be filtered based on the selected session.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-[14px] font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Description (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Founder's Day, Deepavali, etc."
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="w-full neu-input rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-700 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
                        >
                            Save Override
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
