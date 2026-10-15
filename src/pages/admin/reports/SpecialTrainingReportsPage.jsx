import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Award,
  ChevronDown,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import specialTrainingService from "../../../services/specialTrainingService";
import { apiClient } from "../../../services/api";

export default function SpecialTrainingReportsPage() {
  const [trainings, setTrainings] = useState([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [loadingTrainings, setLoadingTrainings] = useState(true);

  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "student" | "absentees"

  // Filter States
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Daily Report State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyData, setDailyData] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PRESENT, ABSENT

  // Student-Wise Report State
  const [studentWiseData, setStudentWiseData] = useState(null);
  const [loadingStudentWise, setLoadingStudentWise] = useState(false);

  // Absentees Analysis State
  const [absenteesData, setAbsenteesData] = useState(null);
  const [loadingAbsentees, setLoadingAbsentees] = useState(false);
  const [absentFilterType, setAbsentFilterType] = useState("1_DAY"); // "1_DAY" | "5_DAYS" | "10_DAYS" | "BELOW_75" | "BELOW_60"

  // 1. Fetch Trainings and Departments on load
  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoadingTrainings(true);
        const [trainingList, deptRes] = await Promise.all([
          specialTrainingService.getAll(),
          apiClient.get("/institution/departments"),
        ]);
        setTrainings(trainingList);
        setDepartments(deptRes.data || []);

        if (trainingList.length > 0) {
          setSelectedTrainingId(trainingList[0].id);
        }
      } catch (err) {
        console.error("Failed to load trainings or departments", err);
      } finally {
        setLoadingTrainings(false);
      }
    };
    fetchInit();
  }, []);

  const activeTraining = useMemo(
    () => trainings.find((t) => t.id === selectedTrainingId) || null,
    [trainings, selectedTrainingId]
  );

  // 2. Fetch Daily Report
  useEffect(() => {
    if (!selectedTrainingId || activeTab !== "daily") return;
    const fetchDaily = async () => {
      setLoadingDaily(true);
      try {
        const res = await specialTrainingService.getDailyReport(selectedTrainingId, {
          date: selectedDate,
          department_id: selectedDept || undefined,
        });
        setDailyData(res);
      } catch (err) {
        console.error("Failed to load daily report", err);
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchDaily();
  }, [selectedTrainingId, selectedDate, selectedDept, activeTab]);

  // 3. Fetch Student-Wise Report
  useEffect(() => {
    if (!selectedTrainingId || activeTab !== "student") return;
    const fetchStudentWise = async () => {
      setLoadingStudentWise(true);
      try {
        const res = await specialTrainingService.getStudentWiseReport(selectedTrainingId, {
          department_id: selectedDept || undefined,
        });
        setStudentWiseData(res);
      } catch (err) {
        console.error("Failed to load student-wise report", err);
      } finally {
        setLoadingStudentWise(false);
      }
    };
    fetchStudentWise();
  }, [selectedTrainingId, selectedDept, activeTab]);

  // 4. Fetch Absentees Report
  useEffect(() => {
    if (!selectedTrainingId || activeTab !== "absentees") return;
    const fetchAbsentees = async () => {
      setLoadingAbsentees(true);
      try {
        let params = { department_id: selectedDept || undefined };
        if (absentFilterType === "1_DAY") params.min_absent_days = 1;
        else if (absentFilterType === "5_DAYS") params.min_absent_days = 5;
        else if (absentFilterType === "10_DAYS") params.min_absent_days = 10;
        else if (absentFilterType === "BELOW_75") {
          params.min_absent_days = 1;
          params.max_percentage = 75.0;
        } else if (absentFilterType === "BELOW_60") {
          params.min_absent_days = 1;
          params.max_percentage = 60.0;
        }

        const res = await specialTrainingService.getAbsenteesReport(selectedTrainingId, params);
        setAbsenteesData(res);
      } catch (err) {
        console.error("Failed to load absentees report", err);
      } finally {
        setLoadingAbsentees(false);
      }
    };
    fetchAbsentees();
  }, [selectedTrainingId, selectedDept, absentFilterType, activeTab]);

  // CSV Export utility
  const handleExportCSV = (filename, headers, rows) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val || ""}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered daily records
  const filteredDailyRecords = useMemo(() => {
    if (!dailyData?.records) return [];
    return dailyData.records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.roll_no?.toLowerCase().includes(q) ||
          r.department_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dailyData, statusFilter, searchQuery]);

  // Filtered student-wise records
  const filteredStudentWiseRecords = useMemo(() => {
    if (!studentWiseData?.students) return [];
    return studentWiseData.students.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.roll_no?.toLowerCase().includes(q) ||
          r.department_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentWiseData, searchQuery]);

  // Filtered absentees records
  const filteredAbsenteesRecords = useMemo(() => {
    if (!absenteesData?.absentees) return [];
    return absenteesData.absentees.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.roll_no?.toLowerCase().includes(q) ||
          r.department_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [absenteesData, searchQuery]);

  if (loadingTrainings) {
    return (
      <div className="flex flex-col items-center justify-center p-16 opacity-60">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading Special Training records...</p>
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-10 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">No Special Trainings Created Yet</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          Create a Final Year Special Training session in the Institution Setup page to enroll students across multiple departments, schedule shared timetables, and assign staff.
        </p>
        <Link
          to="/institution"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Building2 className="w-4 h-4" />
          Go to Institution Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Training Selector & Overview Card ─────────── */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm">
                FINAL YEAR SPECIAL TRAINING
              </span>
              <span className="text-xs font-semibold text-slate-400">Multi-Department Cohort</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTraining ? activeTraining.name : "Special Training Attendance Reports"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                Batch: <strong className="text-slate-800">{activeTraining?.batch_name || "N/A"}</strong>
              </span>
              {activeTraining?.trainer_name && (
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-violet-500" />
                  Trainer: <strong className="text-slate-800">{activeTraining.trainer_name}</strong>
                  {activeTraining.trainer_organization && (
                    <span className="text-slate-400">({activeTraining.trainer_organization})</span>
                  )}
                </span>
              )}
              {activeTraining?.venue && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Venue: <strong className="text-slate-800">{activeTraining.venue}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Training Selector Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Select Training:
            </label>
            <div className="relative min-w-[240px]">
              <select
                value={selectedTrainingId}
                onChange={(e) => setSelectedTrainingId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-800 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-10 shadow-xs cursor-pointer transition-all"
              >
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.batch_name})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-5 mt-5">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "daily"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Daily Attendance (All Students)
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "student"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Student-Wise Attendance
          </button>
          <button
            onClick={() => setActiveTab("absentees")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "absentees"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Absentees Analysis
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Department Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full appearance-none px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 pr-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Picker (Daily tab only) */}
          {activeTab === "daily" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Status Filter (Daily tab only) */}
          {activeTab === "daily" && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("PRESENT")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "PRESENT" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Present
              </button>
              <button
                onClick={() => setStatusFilter("ABSENT")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "ABSENT" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Absent
              </button>
            </div>
          )}

          {/* Absentees Threshold Filter (Absentees tab only) */}
          {activeTab === "absentees" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "1_DAY", label: "Absent ≥ 1 Day" },
                { id: "5_DAYS", label: "Absent ≥ 5 Days" },
                { id: "10_DAYS", label: "Absent ≥ 10 Days" },
                { id: "BELOW_75", label: "< 75% Attendance" },
                { id: "BELOW_60", label: "< 60% Critical" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setAbsentFilterType(btn.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    absentFilterType === btn.id
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* CSV Export Button */}
        <div>
          {activeTab === "daily" && (
            <button
              onClick={() => {
                const headers = ["Roll No", "Name", "Department", "Section", "Status", "Marked By", "Time"];
                const rows = filteredDailyRecords.map((r) => [
                  r.roll_no,
                  r.name,
                  r.department_name,
                  r.section,
                  r.status,
                  r.marked_by || "Auto/System",
                  r.marked_at || "",
                ]);
                handleExportCSV(`Special_Training_Daily_${selectedDate}`, headers, rows);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}

          {activeTab === "student" && (
            <button
              onClick={() => {
                const headers = ["Roll No", "Name", "Department", "Section", "Attended", "Total Sessions", "Percentage (%)", "Category"];
                const rows = filteredStudentWiseRecords.map((r) => [
                  r.roll_no,
                  r.name,
                  r.department_name,
                  r.section,
                  r.attended_sessions,
                  r.total_sessions,
                  r.percentage,
                  r.category,
                ]);
                handleExportCSV(`Special_Training_StudentWise`, headers, rows);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}

          {activeTab === "absentees" && (
            <button
              onClick={() => {
                const headers = ["Roll No", "Name", "Department", "Section", "Absent Days", "Attended", "Total Sessions", "Percentage (%)", "Risk Level", "Last Attended"];
                const rows = filteredAbsenteesRecords.map((r) => [
                  r.roll_no,
                  r.name,
                  r.department_name,
                  r.section,
                  r.absent_days,
                  r.attended_sessions,
                  r.total_sessions,
                  r.percentage,
                  r.risk_level,
                  r.last_attended,
                ]);
                handleExportCSV(`Special_Training_Absentees_Analysis`, headers, rows);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: DAILY ATTENDANCE ───────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Enrolled</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{dailyData?.total_enrolled ?? 0}</p>
            </div>
            <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Present Students</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{dailyData?.present_count ?? 0}</p>
            </div>
            <div className="bg-white/90 border border-rose-100 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">Absent Students</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{dailyData?.absent_count ?? 0}</p>
            </div>
            <div className="bg-white/90 border border-indigo-100 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">Attendance Rate</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{dailyData?.attendance_rate ?? 0}%</p>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {loadingDaily ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400 animate-pulse">
                Loading daily attendance records...
              </div>
            ) : filteredDailyRecords.length === 0 ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400">
                No attendance marks found for the selected date and filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Attendance Status</th>
                      <th className="py-3 px-4">Marked By Staff</th>
                      <th className="py-3 px-4">Recorded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredDailyRecords.map((r) => (
                      <tr key={r.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.roll_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.department_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{r.section}</td>
                        <td className="py-3 px-4">
                          {r.status === "PRESENT" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              PRESENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              ABSENT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {r.marked_by ? (
                            <span className="font-semibold text-indigo-700">{r.marked_by}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unrecorded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {r.marked_at ? new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENT-WISE ATTENDANCE ─────────────────────── */}
      {activeTab === "student" && (
        <div className="space-y-6">
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {loadingStudentWise ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400 animate-pulse">
                Computing cumulative student attendance...
              </div>
            ) : filteredStudentWiseRecords.length === 0 ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400">
                No student records found matching the criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Sessions Attended</th>
                      <th className="py-3 px-4">Attendance Progress</th>
                      <th className="py-3 px-4">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredStudentWiseRecords.map((r) => (
                      <tr key={r.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.roll_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.department_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{r.section}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {r.attended_sessions} / {r.total_sessions}
                        </td>
                        <td className="py-3 px-4 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  r.percentage >= 75
                                    ? "bg-emerald-500"
                                    : r.percentage >= 60
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, r.percentage)}%` }}
                              />
                            </div>
                            <span className="font-mono font-black text-xs text-slate-800 w-12 text-right">
                              {r.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {r.category === "Good" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Good (≥75%)
                            </span>
                          )}
                          {r.category === "Average" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              Average (60-74%)
                            </span>
                          )}
                          {r.category === "Critical" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              Critical (&lt;60%)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ABSENTEES ANALYSIS ──────────────────────────── */}
      {activeTab === "absentees" && (
        <div className="space-y-6">
          {/* Absentees Warning Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Targeted Absenteeism Monitoring
                </h4>
                <p className="text-xs text-amber-700 mt-0.5 font-medium">
                  Showing students exceeding absence limits across all departments in this training cohort.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-900">Total Flagged:</span>
              <strong className="block text-xl font-black text-amber-900">
                {absenteesData?.total_absentees_matched ?? 0}
              </strong>
            </div>
          </div>

          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {loadingAbsentees ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400 animate-pulse">
                Running absentees analysis...
              </div>
            ) : filteredAbsenteesRecords.length === 0 ? (
              <div className="p-12 text-center text-sm font-semibold text-slate-400">
                No students match this absence criteria. High compliance in this training!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Total Absent Days</th>
                      <th className="py-3 px-4">Attended / Total</th>
                      <th className="py-3 px-4">Attendance Rate</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Last Attended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredAbsenteesRecords.map((r) => (
                      <tr key={r.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.roll_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.department_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{r.section}</td>
                        <td className="py-3 px-4 font-black text-rose-600 font-mono text-sm">
                          {r.absent_days} {r.absent_days === 1 ? "Day" : "Days"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {r.attended_sessions} / {r.total_sessions}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-xs text-rose-700">{r.percentage}%</span>
                        </td>
                        <td className="py-3 px-4">
                          {r.risk_level === "High" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              HIGH RISK
                            </span>
                          )}
                          {r.risk_level === "Moderate" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              MODERATE
                            </span>
                          )}
                          {r.risk_level === "Low" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                              LOW RISK
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{r.last_attended}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
