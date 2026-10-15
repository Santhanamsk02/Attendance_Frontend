import React, { useState, useCallback, useEffect } from "react";
import { apiClient } from "../../../services/api";
import { reportsService, downloadBlob } from "../../../services/reportsService";
import { Download, AlertTriangle, ChevronLeft, ChevronRight, Search, Filter, RotateCcw, CheckCircle } from "lucide-react";

export default function DefaultersReport() {
  const [threshold, setThreshold] = useState("");
  const [absentDays, setAbsentDays] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Directory / Filter state
  const [departments, setDepartments] = useState([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    departmentId: "",
    batchId: "",
    section: ""
  });
  
  const [visibleColumns, setVisibleColumns] = useState({
    rollNo: true,
    name: true,
    section: true,
    sem: true,
    emailPhone: true,
    present: true,
    workingDays: true,
    attendance: true,
    daysNeeded: true,
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setIsDeptsLoading(true);
        const res = await apiClient.get('/institution/departments');
        const fullDepts = await Promise.all(res.data.map(async (d) => {
          const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
          return { ...d, batches: batchRes.data };
        }));
        setDepartments(fullDepts);
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        setIsDeptsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (!filters.batchId) {
        setSections([]);
        return;
      }
      setIsSectionsLoading(true);
      try {
        const res = await apiClient.get(`/institution/batches/${filters.batchId}/sections`);
        setSections(res.data);
      } catch (err) {
        console.error("Failed to load sections", err);
        setSections([]);
      } finally {
        setIsSectionsLoading(false);
      }
    };
    fetchSections();
  }, [filters.batchId]);

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      reportsService
        .getDefaulters({
          threshold: threshold || undefined,
          absent_days: absentDays || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          section: filters.section || undefined,
          department_id: filters.departmentId || undefined,
          batch_id: filters.batchId || undefined,
          query: searchTerm || undefined,
          page: p,
          page_size: PAGE_SIZE,
        })
        .then((r) => { 
          setData(r.data); 
          setPage(p); 
          if (r.data?.summary?.from_date) {
            setFromDate(r.data.summary.from_date);
          }
          if (r.data?.summary?.to_date && !toDate) {
            setToDate(r.data.summary.to_date);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [threshold, absentDays, fromDate, toDate, filters, searchTerm]
  );

  const handleFilterChange = (key, value) => {
    const updates = { ...filters };
    updates[key] = value;
    if (key === "departmentId") {
      updates.batchId = "";
      updates.section = "";
    }
    if (key === "batchId") {
      updates.section = "";
    }
    setFilters(updates);
  };

  const handleResetFilters = () => {
    setFilters({ departmentId: "", batchId: "", section: "" });
    setSearchTerm("");
    setThreshold("");
    setAbsentDays("");
    setFromDate("");
    setToDate("");
  };

  const handleExport = async () => {
    try {
      const r = await reportsService.exportDefaulters({
        threshold: threshold || undefined,
        absent_days: absentDays || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        section: filters.section || undefined,
        department_id: filters.departmentId || undefined,
        batch_id: filters.batchId || undefined,
        query: searchTerm || undefined,
      });
      
      let filename = "defaulters.csv";
      if (threshold) filename = `defaulters_below_${threshold}pct.csv`;
      else if (absentDays) filename = `defaulters_${absentDays}_absent.csv`;
      
      downloadBlob(r.data, filename);
    } catch {}
  };

  const selectedDept = departments.find(d => d.id === filters.departmentId);

  return (
    <div className="space-y-4">
      {/* Filters Segment */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span>Defaulters Filtration</span>
          </div>
          <button onClick={handleResetFilters} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Name / Roll No</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
             <label className="block text-[11px] font-bold text-slate-400 mb-1">Attendance Percentage (≤)</label>
             <input
               type="number"
               min="0"
               max="100"
               value={threshold}
               onChange={e => setThreshold(e.target.value)}
               placeholder="e.g. 75"
               className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
             <label className="block text-[11px] font-bold text-slate-400 mb-1">Absent Days (≥)</label>
             <input
               type="number"
               min="0"
               value={absentDays}
               onChange={e => setAbsentDays(e.target.value)}
               placeholder="e.g. 5"
               className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
             />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange("departmentId", e.target.value)}
              disabled={isDeptsLoading}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Batch</label>
            <select
              value={filters.batchId}
              onChange={(e) => handleFilterChange("batchId", e.target.value)}
              disabled={!filters.departmentId || isDeptsLoading}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              <option value="">All Batches</option>
              {selectedDept?.batches?.map(b => (
                <option key={b.id} value={b.id}>{b.batch_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              disabled={!filters.batchId || isSectionsLoading}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-4">
          <div className="flex flex-wrap gap-4">
            {Object.keys(visibleColumns).map(col => (
              <label key={col} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={visibleColumns[col]} 
                  onChange={(e) => setVisibleColumns({...visibleColumns, [col]: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            {data && (
              <button onClick={handleExport}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition">
                <Download className="w-4 h-4" /> CSV
              </button>
            )}
            <button 
              onClick={() => load(1)}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "Loading..." : "Find Defaulters"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary banner */}
      {data && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{data.total} students</span> found matching your filter criteria.
          </p>
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="modern-table text-left w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {visibleColumns.rollNo && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Roll No</th>}
                  {visibleColumns.name && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Name</th>}
                  {visibleColumns.section && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Section</th>}
                  {visibleColumns.sem && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Sem</th>}
                  {visibleColumns.emailPhone && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Email / Phone</th>}
                  {visibleColumns.present && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Present</th>}
                  {visibleColumns.workingDays && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Working Days</th>}
                  {visibleColumns.attendance && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Attendance %</th>}
                  {visibleColumns.daysNeeded && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Days Needed</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-12 text-center text-emerald-600 font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> No students found below the specified thresholds
                      </div>
                    </td>
                  </tr>
                ) : data.data.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition">
                    {visibleColumns.rollNo && <td className="px-6 py-4 font-mono text-xs">{s.roll_no}</td>}
                    {visibleColumns.name && <td className="px-6 py-4 font-bold text-slate-800 text-sm">{s.name}</td>}
                    {visibleColumns.section && <td className="px-6 py-4 font-semibold text-slate-600">{s.section}</td>}
                    {visibleColumns.sem && <td className="px-6 py-4 text-sm text-slate-600">{s.semester}</td>}
                    {visibleColumns.emailPhone && <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-slate-700">{s.email}</div>
                      <div className="text-slate-400 mt-0.5">{s.phone}</div>
                    </td>}
                    {visibleColumns.present && <td className="px-6 py-4 text-emerald-600 font-bold">{s.present_days}</td>}
                    {visibleColumns.workingDays && <td className="px-6 py-4 text-slate-600 font-semibold">{s.total_working_days}</td>}
                    {visibleColumns.attendance && <td className="px-6 py-4">
                      <span className="font-black text-red-500">{s.attendance_pct}%</span>
                    </td>}
                    {visibleColumns.daysNeeded && <td className="px-6 py-4">
                      <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {s.days_needed} days
                      </span>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Page {page} of {data.pages} — {data.total} students</span>
              <div className="flex gap-1.5">
                <button onClick={() => load(page - 1)} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button onClick={() => load(page + 1)} disabled={page === data.pages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Defaulters Analysis</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
            Configure your filters and click "Find Defaulters" to identify students whose attendance has dropped below your required thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
