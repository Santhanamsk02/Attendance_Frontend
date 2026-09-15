import React, { useState, useCallback, useRef, useEffect } from "react";
import { apiClient } from "../../../services/api";
import { reportsService } from "../../../services/reportsService";
import { Search, Printer, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import StudentDayAnalysisModal from "./StudentDayAnalysisModal";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";

// ─── Heatmap Calendar ────────────────────────────────────────────────────────
function HeatmapCalendar({ heatmap, onDateClick }) {
  if (!heatmap || heatmap.length === 0) return null;

  // Group by year-month
  const months = {};
  heatmap.forEach(({ date, status }) => {
    const [y, m] = date.split("-");
    const key = `${y}-${m}`;
    if (!months[key]) months[key] = [];
    months[key].push({ date, status, day: parseInt(date.split("-")[2]) });
  });

  return (
    <div className="space-y-5">
      {Object.entries(months).map(([monthKey, days]) => {
        const [year, month] = monthKey.split("-");
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString("default", {
          month: "long", year: "numeric",
        });
        return (
          <div key={monthKey}>
            <p className="text-xs font-semibold text-slate-500 mb-2">{monthName}</p>
            <div className="flex flex-wrap gap-1.5">
              {days.map(({ date, status, day }) => (
                <div
                  key={date}
                  onClick={() => onDateClick && onDateClick(date)}
                  title={`${date}: ${status} (Click for period analysis)`}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 transition select-none
                    ${status === "Present"
                      ? "bg-emerald-500 text-white"
                      : status === "Absent"
                      ? "bg-red-400 text-white"
                      : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-5 text-xs text-slate-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" /> N/A (No Class)
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentProfileReport() {
  // Report state
  const [selected, setSelected] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisModalData, setAnalysisModalData] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  // Directory / Filter state
  const [departments, setDepartments] = useState([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isListLoading, setIsListLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [filters, setFilters] = useState({
    departmentId: "",
    batchId: "",
    section: ""
  });
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    rollNo: true,
    department: true,
    batch: true,
    section: true,
    currentYear: true,
    attendance: true,
    action: true
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

  const fetchStudentsList = useCallback(async (page = 1) => {
    try {
      setIsListLoading(true);
      const params = {
        page,
        page_size: pagination.limit,
        query: searchTerm || undefined,
        departmentId: filters.departmentId || undefined,
        batchId: filters.batchId || undefined,
        section: filters.section || undefined,
      };
      const res = await apiClient.get('/admin/attendance/students', { params });
      setStudentsList(res.data.items || []);
      setPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total }));
    } catch (err) {
      setStudentsList([]);
    } finally {
      setIsListLoading(false);
    }
  }, [searchTerm, filters, pagination.limit]);

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
  };

  const loadReport = useCallback(
    async (student) => {
      setLoading(true);
      setReportData(null);
      setSelected(student);
      try {
        const r = await reportsService.getStudentReport(student.id, {
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });
        setReportData(r.data);
        if (r.data?.summary?.from_date) {
          setFromDate(r.data.summary.from_date);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate]
  );

  const selectedDept = departments.find(d => d.id === filters.departmentId);
  const selectedBatch = selectedDept?.batches?.find(b => b.id === filters.batchId);
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="space-y-4">
      {!selected ? (
        <>
          {/* Filters Segment */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
              <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <span>Student Profile Filtration</span>
              </div>
              <button onClick={handleResetFilters} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
                <RotateCcw className="w-3 h-3" /> Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <button 
                onClick={() => fetchStudentsList(1)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap"
              >
                Load Students
              </button>
            </div>
          </div>

          {/* Directory List Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {visibleColumns.name && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student Name</th>}
                    {visibleColumns.rollNo && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll No</th>}
                    {visibleColumns.department && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>}
                    {visibleColumns.batch && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Batch</th>}
                    {visibleColumns.section && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>}
                    {visibleColumns.currentYear && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Year</th>}
                    {visibleColumns.attendance && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Attendance %</th>}
                    {visibleColumns.action && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {isListLoading ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                          <span className="text-sm font-semibold">Loading students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : studentsList.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-slate-400 font-semibold">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    studentsList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group">
                        {visibleColumns.name && <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 text-xs">
                              {st.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{st.name}</span>
                          </div>
                        </td>}
                        {visibleColumns.rollNo && <td className="px-6 py-4 text-sm font-medium text-slate-600">{st.roll_no}</td>}
                        {visibleColumns.department && <td className="px-6 py-4 text-sm font-bold text-slate-800">{st.department_code || st.department_name}</td>}
                        {visibleColumns.batch && <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                          {st.batch_name}
                        </td>}
                        {visibleColumns.section && <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                          {st.section}
                        </td>}
                        {visibleColumns.currentYear && <td className="px-6 py-4 text-sm text-slate-600">{st.current_year || (st.academic_year || st.batch_name)}</td>}
                        {visibleColumns.attendance && <td className="px-6 py-4 text-center">
                          {st.expected_sessions > 0 ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              st.attendance_percentage >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {st.attendance_percentage}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">N/A</span>
                          )}
                        </td>}
                        {visibleColumns.action && <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => loadReport(st)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                          >
                            View Report <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isListLoading && studentsList.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchStudentsList(p)}
            />
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => { setSelected(null); setReportData(null); }}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition w-fit"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Student List
            </button>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</label>
                <input
                  type="date" value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</label>
                <input
                  type="date" value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={() => loadReport(selected)}
                className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Reload
              </button>
            </div>
          </div>

          {/* Spinner */}
          {loading && (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100">
              <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Report Data */}
          {reportData && !loading && (
            <div className="space-y-4">
              {/* Student header */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{reportData.student.name}</h2>
                  <p className="text-sm text-slate-500">
                    {reportData.student.roll_no} · Section {reportData.student.section} · Semester {reportData.student.semester}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition print:hidden"
                >
                  <Printer className="w-4 h-4" /> Print PDF
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Overall %",
                    value: `${reportData.summary.overall_pct}%`,
                    cls: reportData.summary.overall_pct >= 75 ? "text-emerald-600" : "text-red-500",
                  },
                  { label: "Present Sessions", value: reportData.summary.present_sessions, cls: "text-emerald-600" },
                  { label: "Absent Sessions",  value: reportData.summary.absent_sessions,  cls: "text-red-500"    },
                  {
                    label: "Absence Streak",
                    value: `${reportData.summary.absence_streak} days`,
                    cls: reportData.summary.absence_streak > 3 ? "text-orange-500" : "text-slate-700",
                  },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Heatmap */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Attendance Heatmap
                  <span className="text-xs font-normal text-slate-400 ml-2">
                    {reportData.summary.from_date} → {reportData.summary.to_date}
                  </span>
                </h3>
                <HeatmapCalendar 
                  heatmap={reportData.heatmap} 
                  onDateClick={(date) => setAnalysisModalData({ studentId: selected.id, date })} 
                />
              </div>

              {/* Subject-wise */}
              {reportData.subject_wise.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700">Subject-wise Attendance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Based on resolvable session records</p>
                  </div>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        {["Subject", "Code", "Sessions", "Present", "%"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.subject_wise.map((s) => (
                        <tr key={s.subject_code} className="hover:bg-slate-50/50">
                          <td className="font-medium">{s.subject_name}</td>
                          <td className="font-mono text-xs">{s.subject_code}</td>
                          <td>{s.total_sessions}</td>
                          <td className="text-emerald-600 font-semibold">{s.present_sessions}</td>
                          <td>
                            <span className={`font-bold ${s.pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                              {s.pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
      )}
    </div>
  );
}
