import React, { useState, useCallback } from "react";
import { reportsService, downloadBlob } from "../../../services/reportsService";
import { apiClient } from "../../../services/api";
import { useReportFilters } from "./ReportFilterContext";
import { Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Users, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import StudentDayAnalysisModal from "./StudentDayAnalysisModal";

const TODAY = new Date().toISOString().slice(0, 10);

const STATUS_TABS = [
  { key: null,      label: "All",     color: "text-slate-700"   },
  { key: "Present", label: "Present", color: "text-emerald-600" },
  { key: "Absent",  label: "Absent",  color: "text-red-500"     },
];

export default function DailyRegisterReport() {
  const { meta } = useReportFilters();
  const [date, setDate] = useState(TODAY);
  const [section, setSection] = useState("");
  const [deptId, setDeptId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);
  
  const [statusFilter, setStatusFilter] = useState(null); // null = all
  const [data, setData] = useState(null);
  const [analysisModalData, setAnalysisModalData] = useState(null);
  
  const [visibleColumns, setVisibleColumns] = useState({
    rollNo: true,
    name: true,
    department: true,
    year: true,
    batch: true,
    section: true,
    morningEntry: true,
    periodsPresent: true,
    periodsAbsent: true,
    periodsNotTaken: true,
    status: true,
  });

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  React.useEffect(() => {
    setBatchId("");
    setSection("");
    setBatches([]);
    setDynamicSections([]);
    if (!deptId) return;
    apiClient.get(`/institution/departments/${deptId}/batches`)
      .then(res => setBatches(res.data))
      .catch(() => {});
  }, [deptId]);

  React.useEffect(() => {
    setSection("");
    setDynamicSections([]);
    if (!batchId) return;
    apiClient.get(`/institution/batches/${batchId}/sections`)
      .then(res => setDynamicSections(res.data))
      .catch(() => {});
  }, [batchId]);

  const load = useCallback(
    (p = 1, sf = statusFilter) => {
      if (!date) return;
      setLoading(true);
      const params = {
        date,
        page: p,
        page_size: PAGE_SIZE,
      };
      if (section)  params.section       = section;
      if (deptId)   params.department_id = deptId;
      if (batchId)  params.batch_id      = batchId;
      if (sf)       params.status        = sf;  // server-side filter

      reportsService
        .getDailyRegister(params)
        .then((r) => { setData(r.data); setPage(p); })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [date, section, deptId, batchId, statusFilter]
  );

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setPage(1);
    load(1, key);  // re-fetch with new status filter immediately
  };

  const handleExport = async () => {
    try {
      const r = await reportsService.exportDailyRegister({
        date,
        section: section || undefined,
        department_id: deptId || undefined,
        batch_id: batchId || undefined,
      });
      downloadBlob(r.data, `attendance_${date}.csv`);
    } catch {}
  };

  // Summary totals always come from the backend (full dataset, not just current page)
  const totalStudents = data?.summary?.total   ?? 0;
  const presentCount  = data?.summary?.present ?? 0;
  const absentCount   = data?.summary?.absent  ?? 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Department</label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">All</option>
            {meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Batch</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={!deptId}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
          >
            <option value="">All</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!batchId}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
          >
            <option value="">All</option>
            {dynamicSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setStatusFilter(null); load(1, null); }}
          disabled={!date || loading}
          className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? "Loading…" : "Load"}
        </button>
        {data && (
          <button
            onClick={handleExport}
            className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        )}
      </div>

      {/* Summary + Filter Tabs */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total */}
          <button
            onClick={() => handleTabChange(null)}
            className={`bg-white rounded-xl p-3 border text-center transition cursor-pointer ${
              statusFilter === null
                ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
                : "border-slate-100 shadow-sm hover:border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-500">Total Students</p>
            <p className="text-xl font-bold mt-0.5 text-slate-800">{totalStudents}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{statusFilter === null ? "Active filter" : "Show all"}</p>
          </button>

          {/* Present */}
          <button
            onClick={() => handleTabChange("Present")}
            className={`bg-white rounded-xl p-3 border text-center transition cursor-pointer ${
              statusFilter === "Present"
                ? "border-emerald-300 ring-2 ring-emerald-100 shadow-sm"
                : "border-slate-100 shadow-sm hover:border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-500">Present</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-600">{presentCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{statusFilter === "Present" ? "Active filter" : "Click to filter"}</p>
          </button>

          {/* Absent */}
          <button
            onClick={() => handleTabChange("Absent")}
            className={`bg-white rounded-xl p-3 border text-center transition cursor-pointer ${
              statusFilter === "Absent"
                ? "border-red-300 ring-2 ring-red-100 shadow-sm"
                : "border-slate-100 shadow-sm hover:border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-500">Absent</p>
            <p className="text-xl font-bold mt-0.5 text-red-500">{absentCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{statusFilter === "Absent" ? "Active filter" : "Click to filter"}</p>
          </button>

          {/* Percentage */}
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
            <p className="text-xs text-slate-500">Attendance %</p>
            <p className={`text-xl font-bold mt-0.5 ${data.summary.pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>
              {data.summary.pct}%
            </p>
          </div>
        </div>
      )}

      {/* Active filter pill */}
      {data && statusFilter && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            statusFilter === "Present" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}>
            {statusFilter === "Present"
              ? <CheckCircle2 className="w-3 h-3" />
              : <XCircle className="w-3 h-3" />}
            Showing {data.total} {statusFilter} students
          </span>
          <button
            onClick={() => handleTabChange(null)}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Show all
          </button>
        </div>
      )}

      {/* Dynamic Summary Charts */}
      {data?.chart_data && data.chart_data.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-[450px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Attendance Breakdown
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-[450px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Attendance Percentages
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => [`${value}%`]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Present_Pct" name="Present %" stroke="#10b981" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="Absent_Pct" name="Absent %" stroke="#f43f5e" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Pie Charts Array */}
      {data?.chart_data && data.chart_data.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6 text-center">
            Attendance Distribution (Present vs Absent)
          </h3>
          <div className="flex flex-wrap gap-8 justify-center">
            {data.chart_data.map((item, idx) => {
              const pieData = [
                { name: 'Present', value: item.Present, color: '#10b981' },
                { name: 'Absent', value: item.Absent, color: '#f43f5e' }
              ];
              return (
                <div key={idx} className="flex flex-col items-center bg-slate-50/50 p-5 rounded-2xl border border-slate-100 min-w-[220px] shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-sm font-bold text-slate-700 mb-4">{item.name}</span>
                  <div className="w-36 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>{item.Present}</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span>{item.Absent}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Column Visibility Toggles */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Columns to Display</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(visibleColumns).map(([key, isVisible]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleColumn(key)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  {visibleColumns.rollNo && <th>Roll No</th>}
                  {visibleColumns.name && <th>Student Name</th>}
                  {visibleColumns.department && <th>Department</th>}
                  {visibleColumns.year && <th>Year</th>}
                  {visibleColumns.batch && <th>Batch</th>}
                  {visibleColumns.section && <th>Section</th>}
                  {visibleColumns.morningEntry && <th>Morning Entry</th>}
                  {visibleColumns.periodsPresent && <th className="text-right">Periods Present</th>}
                  {visibleColumns.periodsAbsent && <th className="text-right">Periods Absent</th>}
                  {visibleColumns.periodsNotTaken && <th className="text-right">Periods Not Taken</th>}
                  {visibleColumns.status && <th>Daily Status</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      {statusFilter === "Absent"
                        ? "No absentees for the selected filters on this date."
                        : "No students found."}
                    </td>
                  </tr>
                ) : data.data.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`transition ${
                        s.status === "Absent"
                          ? "bg-gradient-to-r from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200"
                          : "bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200"
                      }`}
                    >
                    <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    {visibleColumns.rollNo && <td className="font-mono">{s.roll_no}</td>}
                    {visibleColumns.name && <td className="font-medium">{s.name}</td>}
                    {visibleColumns.department && <td>{s.department || '-'}</td>}
                    {visibleColumns.year && <td>{s.year || '-'}</td>}
                    {visibleColumns.batch && <td>{s.batch || '-'}</td>}
                    {visibleColumns.section && <td>{s.section || '-'}</td>}
                    {visibleColumns.morningEntry && (
                      <td>
                        {s.morning_entry === "PRESENT" ? (
                          <span className="text-emerald-600 font-semibold text-xs">Yes</span>
                        ) : s.morning_entry === "ABSENT" ? (
                          <span className="text-red-500 font-semibold text-xs">No</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.periodsPresent && <td className="text-right font-bold text-emerald-600">{s.periods_present}</td>}
                    {visibleColumns.periodsAbsent && <td className="text-right font-bold text-red-500">{s.periods_absent}</td>}
                    {visibleColumns.periodsNotTaken && <td className="text-right font-medium text-slate-400">{s.periods_not_taken}</td>}
                    {visibleColumns.status && (
                      <td>
                        {s.status === "Present" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            <CheckCircle2 className="w-3 h-3" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/50">
                            <XCircle className="w-3 h-3" /> Absent
                          </span>
                        )}
                      </td>
                    )}
                    <td>
                      <button
                        onClick={() => setAnalysisModalData({ studentId: s.id, date: data.date })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-indigo-100"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Page {page} of {data.pages} — {data.total} students
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page === data.pages || loading}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
          <Users className="w-10 h-10 opacity-25" />
          <p>Select a date and click <span className="font-semibold">Load</span> to view the daily register.</p>
        </div>
      )}

      {/* Analysis Modal */}
      {analysisModalData && (
        <StudentDayAnalysisModal
          studentId={analysisModalData.studentId}
          date={analysisModalData.date}
          onClose={() => setAnalysisModalData(null)}
        />
      )}
    </div>
  );
}
