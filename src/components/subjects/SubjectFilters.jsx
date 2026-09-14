import React, { useState, useEffect } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { apiClient } from "../../services/api";
import { SUBJECT_TYPES, STATUS_OPTIONS } from "../../utils/constants";

export default function SubjectFilters({
    filters,
    onChange,
    onReset,
    totalResults,
}) {
    const [departments, setDepartments] = useState([]);

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
                console.error("Failed to load departments in filters", err);
            }
        };
        fetchDepts();
    }, []);

    const allYears = Array.from(new Set(departments.flatMap(d => d.batches?.map(b => b.batch_name) || []))).sort();

    const handleFilterChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    const activeFiltersCount = Object.entries(filters).filter(
        ([k, v]) =>
            k !== "search" && k !== "page" && k !== "limit" && v !== "" && v !== undefined && v !== null
    ).length;

    return (
        <div className="rounded-3xl neu-card p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                    <div className="p-1.5 rounded-xl neu-icon-well text-violet-600">
                        <Filter className="w-3.5 h-3.5" />
                    </div>
                    <span>Filters & Segmentation</span>
                    {activeFiltersCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full neu-badge-violet text-[10px] font-black">
                            {activeFiltersCount} active
                        </span>
                    )}
                </div>

                {activeFiltersCount > 0 && (
                    <button
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* Department */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Department</label>
                    <select
                        value={filters.department || ""}
                        onChange={(e) => handleFilterChange("department", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                        ))}
                    </select>
                </div>

                {/* Academic Year */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Academic Year</label>
                    <select
                        value={filters.academic_year || ""}
                        onChange={(e) => handleFilterChange("academic_year", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Years</option>
                        {allYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Semester */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Semester</label>
                    <select
                        value={filters.semester || ""}
                        onChange={(e) => handleFilterChange("semester", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Semesters</option>
                        {Array.from({ length: 8 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                        ))}
                    </select>
                </div>

                {/* Subject Type */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Subject Type</label>
                    <select
                        value={filters.subject_type || ""}
                        onChange={(e) => handleFilterChange("subject_type", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Types</option>
                        {SUBJECT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                    <select
                        value={filters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Status</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
