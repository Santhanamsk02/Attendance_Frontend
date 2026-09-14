import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { STATUS_OPTIONS } from "../../utils/constants";
import { apiClient } from "../../services/api";
export default function TeacherFilters({
    filters,
    onChange,
    onReset,
    totalResults,
}) {
    const [departments, setDepartments] = React.useState([]);

    React.useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await apiClient.get("/institution/departments");
                setDepartments(Array.isArray(res.data) ? res.data : (res.data.items || []));
            } catch (err) {
                console.error("Failed to load departments for filter:", err);
            }
        };
        fetchDepartments();
    }, []);

    const handleFilterChange = (key, value) => {
        onChange({
            ...filters,
            [key]: value,
        });
    };

    const activeFiltersCount = Object.entries(filters).filter(
        ([k, v]) => k !== "search" && k !== "page" && k !== "limit" && v !== "" && v !== undefined && v !== null
    ).length;

    return (
        <div className="rounded-3xl neu-card p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                    <div className="p-1.5 rounded-xl neu-icon-well text-violet-600">
                        <Filter className="w-3.5 h-3.5" />
                    </div>
                    <span>Filters & Directory Segmentation</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Department
                    </label>
                    <select
                        value={filters.department || ""}
                        onChange={(e) => handleFilterChange("department", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name} ({dept.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Designation
                    </label>
                    <input
                        type="text"
                        value={filters.designation || ""}
                        onChange={(e) => handleFilterChange("designation", e.target.value)}
                        placeholder="Search Designation..."
                        maxLength={30}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold placeholder:text-slate-400 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Status
                    </label>
                    <select
                        value={filters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                                {st.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
