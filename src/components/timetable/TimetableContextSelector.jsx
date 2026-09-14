import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/api";
import { useToast } from "../../hooks/useToast";

export default function TimetableContextSelector({
    context,
    onChange,
    disabled = false,
}) {
    const [departments, setDepartments] = useState([]);
    const [morningStart, setMorningStart] = useState("");
    const [morningEnd, setMorningEnd] = useState("");
    const [isSavingDept, setIsSavingDept] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await apiClient.get('/institution/departments');
                const fullDepts = await Promise.all(res.data.map(async (d) => {
                    const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
                    return { ...d, batches: batchRes.data };
                }));
                setDepartments(fullDepts);
            } catch (err) {
                console.error("Failed to load departments in Timetable Context", err);
            }
        };
        fetchDepts();
    }, []);

    const handleChange = (field, value) => {
        onChange({ ...context, [field]: value });
    };

    const isComplete = Boolean(
        context.department && context.academic_year && context.semester
    );

    // Dynamic cascade for Academic Years
    const selectedDeptObj = departments.find(d => d.code === context.department);
    const availableYears = selectedDeptObj
        ? selectedDeptObj.batches?.map(b => b.batch_name).sort() || []
        : Array.from(new Set(departments.flatMap(d => d.batches?.map(b => b.batch_name) || []))).sort();

    // Find the currently selected batch to identify active semester
    const selectedBatch = selectedDeptObj?.batches?.find(b => b.batch_name === context.academic_year);
    const currentSem = selectedBatch?.current_semester || null;

    useEffect(() => {
        if(selectedDeptObj) {
            const timeStr = selectedDeptObj.morning_entry_time || "";
            if (timeStr.includes("-")) {
                const [start, end] = timeStr.split("-");
                setMorningStart(start);
                setMorningEnd(end);
            } else {
                setMorningStart("");
                setMorningEnd("");
            }
        }
    }, [selectedDeptObj]);

    const handleSaveDeptMorningTime = async () => {
        if(!selectedDeptObj) return;
        try {
            setIsSavingDept(true);
            const timeStr = (morningStart && morningEnd) ? `${morningStart}-${morningEnd}` : "";
            await apiClient.put(`/institution/departments/${selectedDeptObj.id}`, {
                name: selectedDeptObj.name,
                code: selectedDeptObj.code,
                morning_entry_time: timeStr
            });
            
            setDepartments(prev => prev.map(d => d.id === selectedDeptObj.id ? {...d, morning_entry_time: timeStr} : d));
            toast.success("Department morning entry time updated.");
        } catch(err) {
            toast.error(err.message || "Failed to update morning entry time");
        } finally {
            setIsSavingDept(false);
        }
    };

    return (
        <div className="rounded-[20px] neu-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100/80">
                <h3 className="text-xs font-black text-slate-700 pr-5 uppercase tracking-wider flex items-center gap-2.5">
                    Timetable Configuration
                </h3>
                {isComplete && (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                        Context Set
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Department */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Department *
                    </label>
                    <select
                        value={context.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                        disabled={disabled}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                        ))}
                    </select>
                </div>

                {/* Academic Year */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Academic Year *
                    </label>
                    <select
                        value={context.academic_year}
                        onChange={(e) => handleChange("academic_year", e.target.value)}
                        disabled={disabled || !context.department}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
                    >
                        <option value="">Select Year</option>
                        {availableYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Semester */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Semester *
                    </label>
                    <select
                        value={context.semester}
                        onChange={(e) => handleChange("semester", e.target.value)}
                        disabled={disabled || !context.academic_year}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
                    >
                        <option value="">Select Semester</option>
                        {Array.from({ length: 8 }, (_, i) => {
                            const semNum = i + 1;
                            const isCurrent = currentSem === semNum;
                            return (
                                <option key={semNum} value={String(semNum)}>
                                    Semester {semNum} {isCurrent ? "(Current)" : ""}
                                </option>
                            );
                        })}
                    </select>
                </div>

            </div>

            {selectedDeptObj && !disabled && (
                <div className="mt-6 pt-5 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-[12px] font-black text-slate-700 tracking-tight">Department Morning Entry Time</h4>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Configure global morning entry time for all teachers in {selectedDeptObj.name}.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <input 
                                type="time" 
                                value={morningStart} 
                                onChange={e => setMorningStart(e.target.value)} 
                                className="w-[100px] rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                            />
                            <span className="text-slate-400 font-bold text-xs">to</span>
                            <input 
                                type="time" 
                                value={morningEnd} 
                                onChange={e => setMorningEnd(e.target.value)} 
                                className="w-[100px] rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleSaveDeptMorningTime} 
                            disabled={isSavingDept || ((morningStart && morningEnd) ? `${morningStart}-${morningEnd}` : "") === (selectedDeptObj.morning_entry_time || "")}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                        >
                            {isSavingDept ? "Saving..." : "Save Config"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
