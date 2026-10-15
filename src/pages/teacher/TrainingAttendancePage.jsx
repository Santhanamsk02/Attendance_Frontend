import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  QrCode,
  Keyboard,
  Users,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Clock,
  Building2,
  Award,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import specialTrainingService from "../../services/specialTrainingService";

export default function TrainingAttendancePage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const trainingId = searchParams.get("trainingId");
  const periodId = searchParams.get("periodId") || "P1";
  const sessionDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignedTrainings, setAssignedTrainings] = useState([]);
  const [loadingTrainingsList, setLoadingTrainingsList] = useState(false);

  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "scan" | "manual"
  const [manualRollNo, setManualRollNo] = useState("");
  const [scanOverlay, setScanOverlay] = useState(null);

  // Roster Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
  const [rosterSearch, setRosterSearch] = useState("");
  const [markingStudentId, setMarkingStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  // 1. Initialize or Load Training Session
  const loadSession = async () => {
    if (!trainingId) {
      setLoading(false);
      setLoadingTrainingsList(true);
      try {
        const list = await specialTrainingService.getTeacherTodayTrainings(user?.id);
        setAssignedTrainings(list || []);
      } catch (err) {
        console.error("Failed to load today's assigned trainings", err);
      } finally {
        setLoadingTrainingsList(false);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await specialTrainingService.startOrGetSession({
        training_id: trainingId,
        date: sessionDate,
        period_id: periodId,
      });
      setSessionData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to initialize special training attendance session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [trainingId, periodId, sessionDate, user?.id]);

  // 2. Setup Scanner when in "scan" tab
  useEffect(() => {
    let html5QrCode;

    if (activeTab === "scan" && sessionData?.session_id && !error) {
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode("training-scanner-region", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
            ],
            verbose: false,
          });

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (!processingRef.current) {
                handleScanCode(decodedText);
              }
            },
            () => {} // Ignore continuous errors
          );
          scannerRef.current = html5QrCode;
        } catch (err) {
          console.error("Scanner Error", err);
        }
      };
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [activeTab, sessionData?.session_id, error]);

  // Handle scanned code
  const handleScanCode = async (decodedText) => {
    if (!decodedText || !sessionData?.session_id) return;

    processingRef.current = true;
    const cleanRoll = decodedText.trim().toUpperCase();

    try {
      const res = await specialTrainingService.markStudent(sessionData.session_id, {
        roll_no: cleanRoll,
        status: "PRESENT",
        method: "BARCODE_SCAN",
        teacher_id: user?.id,
      });

      setScanOverlay({
        name: res.name || cleanRoll,
        roll: res.roll_no || cleanRoll,
        status: "SUCCESS",
      });

      // Update local roster
      setSessionData((prev) => {
        if (!prev) return prev;
        const nextRoster = prev.roster.map((s) => {
          if (s.roll_no.toUpperCase() === cleanRoll) {
            return {
              ...s,
              status: "PRESENT",
              marked_by: user?.name || "You",
              marked_at: new Date().toISOString(),
              method: "BARCODE_SCAN",
            };
          }
          return s;
        });

        const newPresent = nextRoster.filter((s) => s.status === "PRESENT").length;
        return {
          ...prev,
          present_count: newPresent,
          roster: nextRoster,
        };
      });

      setTimeout(() => {
        setScanOverlay(null);
        processingRef.current = false;
      }, 1400);
    } catch (err) {
      setScanOverlay({
        name: cleanRoll,
        roll: cleanRoll,
        status: "ERROR",
        message: err.response?.data?.detail || "Student not enrolled in this training",
      });
      setTimeout(() => {
        setScanOverlay(null);
        processingRef.current = false;
      }, 1800);
    }
  };

  // Toggle student attendance status from Roster
  const handleToggleStudent = async (student) => {
    if (!sessionData?.session_id || markingStudentId) return;

    const newStatus = student.status === "PRESENT" ? "ABSENT" : "PRESENT";
    setMarkingStudentId(student.student_id);

    try {
      await specialTrainingService.markStudent(sessionData.session_id, {
        student_id: student.student_id,
        status: newStatus,
        method: "MANUAL_ENTRY",
        teacher_id: user?.id,
      });

      setSessionData((prev) => {
        if (!prev) return prev;
        const nextRoster = prev.roster.map((s) => {
          if (s.student_id === student.student_id) {
            return {
              ...s,
              status: newStatus,
              marked_by: newStatus === "PRESENT" ? (user?.name || "You") : null,
              marked_at: newStatus === "PRESENT" ? new Date().toISOString() : null,
              method: "MANUAL_ENTRY",
            };
          }
          return s;
        });

        const newPresent = nextRoster.filter((s) => s.status === "PRESENT").length;
        const newAbsent = nextRoster.filter((s) => s.status === "ABSENT").length;
        return {
          ...prev,
          present_count: newPresent,
          absent_count: newAbsent,
          roster: nextRoster,
        };
      });
    } catch (err) {
      showErrorToast(err.response?.data?.detail || "Failed to update attendance");
    } finally {
      setMarkingStudentId(null);
    }
  };

  // Mark via manual text entry
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualRollNo.trim()) return;

    await handleScanCode(manualRollNo.trim());
    setManualRollNo("");
  };

  // Finalize Attendance Session
  const handleFinalize = async () => {
    if (!sessionData?.session_id) return;

    setSubmitting(true);
    try {
      const presentIds = (sessionData.roster || [])
        .filter((s) => s.status === "PRESENT")
        .map((s) => s.student_id);

      await specialTrainingService.submitSession(sessionData.session_id, {
        marked_student_ids: presentIds,
        teacher_id: user?.id,
      });

      showSuccessToast("Special training attendance finalized successfully!");
      navigate("/teacher/today");
    } catch (err) {
      showErrorToast(err.response?.data?.detail || "Failed to finalize session");
    } finally {
      setSubmitting(false);
    }
  };

  // Departments list from roster for filtering
  const distinctDepartments = Array.from(
    new Set((sessionData?.roster || []).map((s) => s.department_name).filter(Boolean))
  );

  // Filtered Roster
  const filteredRoster = (sessionData?.roster || []).filter((s) => {
    if (selectedDeptFilter && s.department_name !== selectedDeptFilter) return false;
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.roll_no?.toLowerCase().includes(q) ||
        s.department_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 opacity-60">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Initializing Special Training attendance session...</p>
      </div>
    );
  }

  if (!trainingId) {
    if (loadingTrainingsList) {
      return (
        <div className="flex flex-col items-center justify-center p-16 opacity-60">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-500">Checking today's assigned training sessions...</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Final Year Special Training Attendance
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Select an active training period below to open the attendance scanner & multi-department roster.
          </p>
        </div>

        {assignedTrainings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl neu-inset border border-slate-200/50 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg text-slate-800 font-black">No Training Sessions Today</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              You are currently not assigned to take attendance for any special training sessions scheduled for today.
            </p>
            <button
              onClick={() => navigate("/teacher/today")}
              className="mt-6 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              View Regular Classes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTrainings.map((tr) => (
              <div
                key={tr.slot_id}
                className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Period {tr.period_id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {tr.present_count} / {tr.enrolled_count} Present
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {tr.training_name}
                  </h3>
                  {tr.topic && (
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      {tr.topic}
                    </p>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700">{tr.start_time} - {tr.end_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trainer: <strong className="text-slate-700">{tr.trainer_name || "Assigned Trainer"}</strong></span>
                  </div>
                  {tr.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Venue: <strong className="text-slate-700">{tr.venue}</strong></span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/teacher/training-attendance?trainingId=${tr.training_id}&periodId=${tr.period_id}&date=${tr.date}`
                    )
                  }
                  className="w-full mt-2 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-3.5 h-3.5" /> Start / Continue Attendance
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-3xl text-center border border-slate-200/80 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Session Initialization Issue</h2>
        <p className="text-xs text-slate-500 font-semibold">{error}</p>
        <button
          onClick={() => navigate("/teacher/today")}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Return to Today's Classes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/teacher/today")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Schedule
        </button>
        <button
          onClick={loadSession}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-all"
          title="Sync Attendance Across Multiple Teachers"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Concurrent Marks
        </button>
      </div>

      {/* ── Training Context Banner ───────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-xs">
                FINAL YEAR SPECIAL TRAINING
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Period: <strong>{sessionData.period_id}</strong> • Date: <strong>{sessionData.date}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {sessionData.training_name}
            </h1>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Enrolled</span>
              <p className="text-xl font-black text-slate-800">{sessionData.total_enrolled}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Present</span>
              <p className="text-xl font-black text-emerald-700">{sessionData.present_count}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Absent</span>
              <p className="text-xl font-black text-rose-700">{sessionData.total_enrolled - sessionData.present_count}</p>
            </div>
          </div>
        </div>

        {/* Action Modes Selector */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("roster")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "roster"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Multi-Dept Roster ({sessionData.total_enrolled})
            </button>
            <button
              onClick={() => setActiveTab("scan")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "scan"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Barcode / Camera Scan
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "manual"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Manual Roll Entry
            </button>
          </div>

          <button
            onClick={handleFinalize}
            disabled={submitting}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting ? "Finalizing..." : "Finalize Attendance Session"}
          </button>
        </div>
      </div>

      {/* ── TAB 1: MULTI-DEPARTMENT ROSTER CHECKLIST ──────────────── */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Roster Filters */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative min-w-[180px]">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 pr-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Enrolled Departments</option>
                  {distinctDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student by name or roll..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing {filteredRoster.length} of {sessionData.total_enrolled} students
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
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
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredRoster.map((s) => {
                    const isPresent = s.status === "PRESENT";
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.roll_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {s.department_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{s.section}</td>
                        <td className="py-3 px-4">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              PRESENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">
                              NOT MARKED (ABSENT)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          {s.marked_by ? (
                            <span className="text-indigo-600">{s.marked_by}</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleStudent(s)}
                            disabled={markingStudentId === s.student_id}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                              isPresent
                                ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                            }`}
                          >
                            {isPresent ? "Mark Absent" : "Mark Present"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CAMERA / BARCODE SCANNER ───────────────────────── */}
      {activeTab === "scan" && (
        <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-800">Scan Student ID Barcode / QR</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Point camera at student ID card. Scanned students will be attributed to your staff record.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 aspect-square max-w-sm mx-auto shadow-inner">
            <div id="training-scanner-region" className="w-full h-full" />

            {/* Scan Overlay Card */}
            {scanOverlay && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
                <div
                  className={`p-5 rounded-2xl text-center space-y-2 border max-w-xs w-full shadow-2xl ${
                    scanOverlay.status === "SUCCESS"
                      ? "bg-emerald-950/90 border-emerald-500 text-emerald-100"
                      : "bg-rose-950/90 border-rose-500 text-rose-100"
                  }`}
                >
                  {scanOverlay.status === "SUCCESS" ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  ) : (
                    <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  )}
                  <h4 className="font-bold text-sm truncate">{scanOverlay.name}</h4>
                  <p className="font-mono text-xs opacity-80">{scanOverlay.roll}</p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                      scanOverlay.status === "SUCCESS"
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {scanOverlay.status === "SUCCESS" ? "MARKED PRESENT" : "NOT FOUND"}
                  </span>
                  {scanOverlay.message && (
                    <p className="text-[10px] opacity-75">{scanOverlay.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: MANUAL ENTRY ──────────────────────────────────── */}
      {activeTab === "manual" && (
        <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-800">Manual Student Roll Entry</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Type or paste the student's roll number to mark them present in this special training session.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Roll Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 21IT001 or 21CS042"
                value={manualRollNo}
                onChange={(e) => setManualRollNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Mark Student Present
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
