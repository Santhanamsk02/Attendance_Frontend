import React from "react";
import { useReportFilters } from "./ReportFilterContext";

export default function GlobalFilterBar({ showDateRange = true }) {
  const { filters, updateFilter, resetFilters, meta } = useReportFilters();

  const inputCls =
    "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none transition";

  return (
    <div className="flex flex-wrap items-end gap-2 p-3 bg-white/80 backdrop-blur border border-slate-100 rounded-xl shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Department</span>
        <select className={inputCls} value={filters.department_id}
          onChange={(e) => updateFilter("department_id", e.target.value)}>
          <option value="">All Departments</option>
          {meta.departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Section</span>
        <select className={inputCls} value={filters.section}
          onChange={(e) => updateFilter("section", e.target.value)}>
          <option value="">All Sections</option>
          {meta.sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Semester</span>
        <select className={inputCls} value={filters.semester}
          onChange={(e) => updateFilter("semester", e.target.value)}>
          <option value="">All Semesters</option>
          {meta.semesters.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {showDateRange && (
        <>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</span>
            <input type="date" className={inputCls} value={filters.from_date}
              onChange={(e) => updateFilter("from_date", e.target.value)} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</span>
            <input type="date" className={inputCls} value={filters.to_date}
              onChange={(e) => updateFilter("to_date", e.target.value)} />
          </div>
        </>
      )}

      <button onClick={resetFilters}
        className="h-9 px-3 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
        Reset
      </button>
    </div>
  );
}
