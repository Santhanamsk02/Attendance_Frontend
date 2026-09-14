import React, { useState, useCallback, useEffect } from "react";
import { reportsService } from "../../../services/reportsService";
import { useReportFilters } from "./ReportFilterContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

export default function TrendsAnalyticsReport() {
  const { meta } = useReportFilters();
  const [level, setLevel] = useState("section");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState("");
  const [batchId, setBatchId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [trend, setTrend] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { level, from_date: fromDate, to_date: toDate };
    if (section) params.section = section;
    if (batchId) params.batch_id = batchId;
    if (deptId) params.department_id = deptId;

    Promise.all([
      reportsService.getTrends(params),
      reportsService.getSummary({ level }),
    ])
      .then(([tRes, sRes]) => { setTrend(tRes.data); setSummary(sRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [level, fromDate, toDate, section, batchId, deptId]);

  useEffect(() => { load(); }, []);

  // Process daily data for recharts: pivot by label
  const chartData = React.useMemo(() => {
    if (!trend?.daily) return [];
    const byDate = {};
    trend.daily.forEach(({ att_date, label, pct_present }) => {
      if (!byDate[att_date]) byDate[att_date] = { date: att_date };
      byDate[att_date][label] = pct_present;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [trend]);

  const labels = React.useMemo(() => {
    if (!trend?.daily) return [];
    return [...new Set(trend.daily.map((r) => r.label))];
  }, [trend]);

  const summaryKey = level === "section" ? "section" : level === "batch" ? "batch_name" : "department_name";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">View by</label>
          <select value={level} onChange={(e) => { setLevel(e.target.value); setSection(""); setBatchId(""); setDeptId(""); }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
            <option value="section">Section</option>
            <option value="batch">Batch</option>
            <option value="department">Department</option>
          </select>
        </div>

        {level === "section" && (
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
              <option value="">All Sections</option>
              {meta.sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {level === "batch" && (
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Batch</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
              <option value="">All Batches</option>
              {meta.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        {level === "department" && (
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Department</label>
            <select value={deptId} onChange={(e) => setDeptId(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400">
              <option value="">All Departments</option>
              {meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400" />
        </div>

        <button onClick={load} disabled={loading}
          className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Attendance % Over Time</h3>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            No data for the selected filters and date range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              {labels.map((label, i) => (
                <Line key={label} type="monotone" dataKey={label} stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly comparison (sections only) */}
      {level === "section" && trend?.weekly?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Weekly Trend (Last 20 Weeks)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend.weekly} margin={{ left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="pct_present" name="Present %" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Overall Summary Table */}
      {summary && summary.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Overall Summary — All Time</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  {[level === "section" ? "Section" : level === "batch" ? "Batch" : "Department",
                    "Working Days", "Present Days", "Absent Days", "Overall %"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="font-semibold">{row[summaryKey]}</td>
                    <td>{row.working_days_recorded}</td>
                    <td className="text-emerald-600">{row.total_present}</td>
                    <td className="text-red-500">{row.total_absent}</td>
                    <td>
                      <span className={`font-bold ${row.overall_pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                        {row.overall_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
