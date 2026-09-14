import React, { useState, useEffect } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { apiClient } from "../../services/api";
import { STATUS_OPTIONS } from "../../utils/constants";

export default function StudentFilters({
  filters,
  onChange,
  onReset,
  totalResults,
}) {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get('/institution/departments');
        const fullDepts = await Promise.all(res.data.map(async (d) => {
          const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
          return { ...d, batches: batchRes.data };
        }));
        setDepartments(fullDepts);
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const handleFilterChange = (key, value) => {
    const updates = { ...filters };
    updates[key] = value;
    if (key === "department_id") {
      updates.batch_id = "";
      updates.section = "";
    }
    if (key === "batch_id") {
      updates.section = "";
    }
    onChange(updates);
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([k, v]) => k !== "search" && k !== "page" && k !== "limit" && v !== "" && v !== undefined && v !== null
  ).length;

  const selectedDept = departments.find(d => d.id === filters.department_id);
  const selectedBatch = selectedDept?.batches?.find(b => b.id === filters.batch_id);

  return (
    <div className="rounded-3xl neu-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
          <div className="p-1.5 rounded-xl neu-icon-well text-violet-600">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span>Filters & Cohort Segmentation</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Department
          </label>
          <select
            value={filters.department_id || ""}
            onChange={(e) => handleFilterChange("department_id", e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Batch Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Academic Batch
          </label>
          <select
            value={filters.batch_id || ""}
            onChange={(e) => handleFilterChange("batch_id", e.target.value)}
            disabled={!filters.department_id || isLoading}
            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
          >
            <option value="">All Batches</option>
            {selectedDept?.batches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name}
              </option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Section
          </label>
          <select
            value={filters.section || ""}
            onChange={(e) => handleFilterChange("section", e.target.value)}
            disabled={!filters.batch_id}
            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
          >
            <option value="">All Sections</option>
            {selectedBatch && Array.from({ length: selectedBatch.sections_count }).map((_, i) => (
              <option key={i} value={String.fromCharCode(65 + i)}>
                Section {String.fromCharCode(65 + i)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
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
