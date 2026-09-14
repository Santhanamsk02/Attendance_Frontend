import React, { useState, useEffect } from "react";
import { reportsService } from "../../../services/reportsService";
import { ShieldAlert, RefreshCw } from "lucide-react";

function InfoCard({ label, value, sub, danger }) {
  return (
    <div className={`rounded-xl p-4 border ${danger ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${danger ? "text-red-600" : "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DataHealthReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    reportsService.getDataHealth()
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load data health report."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
      <ShieldAlert className="w-5 h-5" /> {error}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Data-Health Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Admin-only view — not visible to staff</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard
          label="Orphaned Attendance Marks"
          value={data.orphaned_marks_total}
          sub="Marks with no matching session record"
          danger={data.orphaned_marks_total > 0}
        />
        <InfoCard
          label="Partial Roster Sessions (last 30d)"
          value={data.partial_roster_sessions.length}
          sub="Sessions where < 50% of section was marked"
          danger={data.partial_roster_sessions.length > 0}
        />
      </div>

      {/* Orphaned marks by date */}
      {data.orphaned_marks_by_date.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Orphaned Marks — by Date</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These marks exist in attendance_marks but have no attendance_session row. They are still counted via day_wise_attendance.
            </p>
          </div>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orphaned Mark Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.orphaned_marks_by_date.map((r) => (
                <tr key={r.mark_date} className="hover:bg-slate-50/50">
                  <td className="font-mono">{r.mark_date}</td>
                  <td className="text-red-500 font-semibold">{r.mark_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partial roster sessions */}
      {data.partial_roster_sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Partial Roster Sessions (Last 30 Days)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sections where less than 50% of enrolled students were marked on a given day.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  {["Section", "Date", "Marked", "Enrolled", "Coverage"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.partial_roster_sessions.map((r, i) => (
                  <tr key={i} className="hover:bg-amber-50/30">
                    <td className="font-semibold">{r.section}</td>
                    <td className="font-mono">{r.date}</td>
                    <td className="text-emerald-600">{r.marked_count}</td>
                    <td>{r.enrolled_count}</td>
                    <td>
                      <span className="font-bold text-amber-600">{r.coverage_pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.orphaned_marks_total === 0 && data.partial_roster_sessions.length === 0 && (
        <div className="text-center py-12 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 font-medium">
          ✓ All data looks healthy — no orphaned marks or partial rosters detected.
        </div>
      )}
    </div>
  );
}
