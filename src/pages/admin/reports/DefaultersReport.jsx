import React, { useState, useCallback } from "react";
import { reportsService, downloadBlob } from "../../../services/reportsService";
import { useReportFilters } from "./ReportFilterContext";
import { Download, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export default function DefaultersReport() {
  const { meta } = useReportFilters();
  const [threshold, setThreshold] = useState(75);
  const [section, setSection] = useState("");
  const [deptId, setDeptId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      reportsService
        .getDefaulters({
          threshold,
          section: section || undefined,
          department_id: deptId || undefined,
          page: p,
          page_size: PAGE_SIZE,
        })
        .then((r) => { setData(r.data); setPage(p); })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [threshold, section, deptId]
  );

  const handleExport = async () => {
    try {
      const r = await reportsService.exportDefaulters({
        threshold,
        section: section || undefined,
        department_id: deptId || undefined,
      });
      downloadBlob(r.data, `defaulters_${threshold}pct.csv`);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Threshold %
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={50} max={90} step={5} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-28"
            />
            <span className="text-sm font-bold text-slate-700 w-10">{threshold}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Department</label>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
            <option value="">All</option>
            {meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Section</label>
          <select value={section} onChange={(e) => setSection(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
            <option value="">All</option>
            {meta.sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button onClick={() => load(1)} disabled={loading}
          className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          {loading ? "Loading…" : "Find Defaulters"}
        </button>

        {data && (
          <button onClick={handleExport}
            className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1.5 transition">
            <Download className="w-4 h-4" /> CSV
          </button>
        )}
      </div>

      {/* Summary banner */}
      {data && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{data.total} students</span> below {threshold}% attendance threshold.
          </p>
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  {["Roll No", "Name", "Section", "Sem", "Email / Phone",
                    "Present", "Working Days", "Attendance %", "Days Needed"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-emerald-600 font-medium">
                      ✓ No students below {threshold}% threshold
                    </td>
                  </tr>
                ) : data.data.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition">
                    <td className="font-mono text-xs">{s.roll_no}</td>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.section}</td>
                    <td>{s.semester}</td>
                    <td className="text-xs">
                      <div>{s.email}</div>
                      <div className="text-slate-400">{s.phone}</div>
                    </td>
                    <td className="text-emerald-600 font-semibold">{s.present_days}</td>
                    <td>{s.total_working_days}</td>
                    <td>
                      <span className="font-bold text-red-500">{s.attendance_pct}%</span>
                    </td>
                    <td>
                      <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {s.days_needed} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Page {page} of {data.pages} — {data.total} students</span>
              <div className="flex gap-1">
                <button onClick={() => load(page - 1)} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => load(page + 1)} disabled={page === data.pages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          Set the threshold and click "Find Defaulters" to view the shortage report.
        </div>
      )}
    </div>
  );
}
