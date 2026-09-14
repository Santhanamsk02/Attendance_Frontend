import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  UserCheck,
  PlusCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  FileText,
  Building,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { teacherService } from "../../services/teacherService";
import { subjectService } from "../../services/subjectService";
import { useToast } from "../../hooks/useToast";

const OVERRIDE_TYPES = [
  { id: "SUBSTITUTE_STAFF", label: "Substitute Staff", icon: UserCheck, color: "from-sky-500 to-blue-600", badge: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: "CHANGE_PERIOD", label: "Change / Swap Period", icon: Layers, color: "from-indigo-500 to-violet-600", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "ADD_PERIOD", label: "Add Extra Period", icon: PlusCircle, color: "from-emerald-500 to-teal-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "CHANGE_TIMINGS", label: "Change Bell Timings", icon: Clock, color: "from-amber-500 to-orange-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "HOLIDAY", label: "Declare Holiday", icon: AlertTriangle, color: "from-rose-500 to-pink-600", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "HALF_DAY", label: "Half Day", icon: Calendar, color: "from-violet-500 to-purple-600", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "EXAM_DAY", label: "Exam / Event Schedule", icon: Sparkles, color: "from-cyan-500 to-blue-600", badge: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "DAY_SWAP", label: "Day Schedule Swap", icon: ArrowRight, color: "from-teal-500 to-emerald-600", badge: "bg-teal-100 text-teal-700 border-teal-200" }
];

export default function CalendarOverrideModal({
  isOpen,
  initialData = null,
  defaultStartDate = "",
  defaultEndDate = "",
  onClose,
  onSave
}) {
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [overrideType, setOverrideType] = useState("SUBSTITUTE_STAFF");
  const [startDate, setStartDate] = useState(defaultStartDate || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(defaultEndDate || defaultStartDate || new Date().toISOString().split("T")[0]);

  // Scope
  const [scope, setScope] = useState("SECTION"); // ALL, DEPT, SEMESTER, SECTION
  const [departmentId, setDepartmentId] = useState("IT");
  const [academicYear, setAcademicYear] = useState("2023-2027");
  const [semester, setSemester] = useState("5");
  const [sectionName, setSectionName] = useState("A");

  // Type specific states
  const [substituteDetails, setSubstituteDetails] = useState({
    periodId: "period-1",
    originalTeacherId: "",
    substituteTeacherId: "",
    subjectId: "",
    reason: "On Leave"
  });

  const [changePeriodDetails, setChangePeriodDetails] = useState({
    periodId: "period-1",
    newSubjectId: "",
    newTeacherId: "",
    room: "",
    notes: ""
  });

  const [addPeriodDetails, setAddPeriodDetails] = useState({
    periodName: "Period 8 (Extra)",
    startTime: "16:30",
    endTime: "17:30",
    subjectId: "",
    teacherId: "",
    room: "Lab 2"
  });

  const [changeTimingsDetails, setChangeTimingsDetails] = useState({
    reason: "Assembly / Shortened Classes",
    periods: [
      { period: "Period 1", start: "09:00", end: "09:40" },
      { period: "Period 2", start: "09:40", end: "10:20" },
      { period: "Period 3", start: "10:30", end: "11:10" },
      { period: "Period 4", start: "11:10", end: "11:50" },
    ]
  });

  const [holidayDetails, setHolidayDetails] = useState({
    reason: "Public Holiday / College Event",
    holidayCategory: "FESTIVAL" // FESTIVAL, WEATHER, EMERGENCY, INSTITUTIONAL
  });

  const [halfDayDetails, setHalfDayDetails] = useState({
    sessionType: "MORNING", // MORNING or AFTERNOON
    reason: "Faculty Meeting / Half-day Event"
  });

  const [examEventDetails, setExamEventDetails] = useState({
    eventType: "EXAM", // EXAM, CULTURAL, SPORTS, WORKSHOP
    eventName: "Mid-Semester Examinations",
    description: "Regular classes suspended for hall examinations"
  });

  const [daySwapDetails, setDaySwapDetails] = useState({
    sourceDay: "MON", // Run Monday timetable on this date
    reason: "Working Saturday against Monday schedule"
  });

  // Dropdown lists
  const [teachersList, setTeachersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const tRes = await teacherService.getTeachers({ limit: 100, status: "active" });
        setTeachersList(tRes.items || []);
      } catch {
        setTeachersList([]);
      }
      try {
        const sRes = await subjectService.getSubjects({ limit: 100, status: "active" });
        setSubjectsList(sRes.items || []);
      } catch {
        setSubjectsList([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setOverrideType(initialData.override_type || "SUBSTITUTE_STAFF");
      setStartDate(initialData.start_date || "");
      setEndDate(initialData.end_date || initialData.start_date || "");
      setDepartmentId(initialData.department_id || "IT");
      setAcademicYear(initialData.academic_year || "2023-2027");
      setSemester(initialData.semester ? String(initialData.semester) : "5");
      setSectionName(initialData.section_name || "A");
      if (initialData.department_id && initialData.section_name) setScope("SECTION");
      else if (initialData.department_id) setScope("DEPT");
      else setScope("ALL");

      const d = initialData.details || {};
      if (initialData.override_type === "SUBSTITUTE_STAFF") setSubstituteDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "CHANGE_PERIOD") setChangePeriodDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "ADD_PERIOD") setAddPeriodDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "CHANGE_TIMINGS") setChangeTimingsDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "HOLIDAY") setHolidayDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "HALF_DAY") setHalfDayDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "EXAM_DAY") setExamEventDetails(prev => ({ ...prev, ...d }));
      if (initialData.override_type === "DAY_SWAP") setDaySwapDetails(prev => ({ ...prev, ...d }));
    } else {
      setStartDate(defaultStartDate || new Date().toISOString().split("T")[0]);
      setEndDate(defaultEndDate || defaultStartDate || new Date().toISOString().split("T")[0]);
    }
  }, [initialData, defaultStartDate, defaultEndDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please specify both Start Date and End Date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End Date cannot be earlier than Start Date.");
      return;
    }

    let detailsPayload = {};
    let computedTitle = title.trim();

    switch (overrideType) {
      case "SUBSTITUTE_STAFF":
        detailsPayload = substituteDetails;
        if (!computedTitle) {
          const subT = teachersList.find(t => t.id === substituteDetails.substituteTeacherId);
          computedTitle = `Substitute: ${subT ? subT.name : 'Staff'} (${substituteDetails.periodId.toUpperCase()})`;
        }
        break;
      case "CHANGE_PERIOD":
        detailsPayload = changePeriodDetails;
        if (!computedTitle) computedTitle = `Period Change: ${changePeriodDetails.periodId.toUpperCase()}`;
        break;
      case "ADD_PERIOD":
        detailsPayload = addPeriodDetails;
        if (!computedTitle) computedTitle = `Extra Class: ${addPeriodDetails.periodName}`;
        break;
      case "CHANGE_TIMINGS":
        detailsPayload = changeTimingsDetails;
        if (!computedTitle) computedTitle = `Custom Bell Schedule: ${changeTimingsDetails.reason}`;
        break;
      case "HOLIDAY":
        detailsPayload = holidayDetails;
        if (!computedTitle) computedTitle = `Holiday: ${holidayDetails.reason}`;
        break;
      case "HALF_DAY":
        detailsPayload = halfDayDetails;
        if (!computedTitle) computedTitle = `${halfDayDetails.sessionType === "MORNING" ? "Morning" : "Afternoon"} Half Day`;
        break;
      case "EXAM_DAY":
        detailsPayload = examEventDetails;
        if (!computedTitle) computedTitle = examEventDetails.eventName || "Exam Day";
        break;
      case "DAY_SWAP":
        detailsPayload = daySwapDetails;
        if (!computedTitle) computedTitle = `Working on ${daySwapDetails.sourceDay} Timetable`;
        break;
      default:
        detailsPayload = {};
    }

    const payload = {
      title: computedTitle,
      override_type: overrideType,
      start_date: startDate,
      end_date: endDate,
      department_id: scope === "ALL" ? null : departmentId,
      batch_id: scope === "ALL" ? null : "batch-1",
      academic_year: scope === "ALL" ? null : academicYear,
      semester: scope === "ALL" ? null : parseInt(semester, 10),
      section_name: scope === "ALL" || scope === "DEPT" ? null : sectionName,
      details: detailsPayload
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {initialData ? "Edit Calendar Override" : "Configure Timetable Override"}
              </h3>
              <p className="text-xs text-indigo-200/80 font-medium">
                Set custom single-day or date-range schedule overrides for college attendance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Override Category Selector */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              1. Choose Override Configuration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OVERRIDE_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = overrideType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOverrideType(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 font-bold shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mb-1.5 ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Date Range Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date (Range Override) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Scope Selector (All, Dept, Section) */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
            <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider">
              2. Target Scope (Which Students / Classes are Affected?)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "ALL", label: "Entire Institution / All Departments" },
                { id: "DEPT", label: "Department-wide" },
                { id: "SECTION", label: "Specific Section" }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScope(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    scope === s.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {scope !== "ALL" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="IT">Information Tech (IT)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="MECH">Mechanical (MECH)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                {scope === "SECTION" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                    <input
                      type="text"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title / Summary (Optional — Auto-generated if empty)
            </label>
            <input
              type="text"
              placeholder="e.g. Substitute staff for Prof. John / Sports Day Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* ── Type Specific Fields ───────────────────────── */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Specific Details for {OVERRIDE_TYPES.find(t => t.id === overrideType)?.label}
            </h4>

            {/* 1. SUBSTITUTE STAFF */}
            {overrideType === "SUBSTITUTE_STAFF" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period Slot</label>
                  <select
                    value={substituteDetails.periodId}
                    onChange={(e) => setSubstituteDetails(prev => ({ ...prev, periodId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="period-1">Period 1 (08:30 - 09:30)</option>
                    <option value="period-2">Period 2 (09:30 - 10:30)</option>
                    <option value="period-3">Period 3 (10:45 - 11:45)</option>
                    <option value="period-4">Period 4 (11:45 - 12:45)</option>
                    <option value="period-5">Period 5 (13:45 - 14:45)</option>
                    <option value="period-6">Period 6 (14:45 - 15:45)</option>
                    <option value="period-7">Period 7 (15:45 - 16:45)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Substitute Staff Member</label>
                  <select
                    value={substituteDetails.substituteTeacherId}
                    onChange={(e) => setSubstituteDetails(prev => ({ ...prev, substituteTeacherId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="">Select Substitute Teacher...</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.employee_id || t.department})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Substitution</label>
                  <input
                    type="text"
                    value={substituteDetails.reason}
                    onChange={(e) => setSubstituteDetails(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 2. CHANGE / SWAP PERIOD */}
            {overrideType === "CHANGE_PERIOD" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period Slot</label>
                  <select
                    value={changePeriodDetails.periodId}
                    onChange={(e) => setChangePeriodDetails(prev => ({ ...prev, periodId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="period-1">Period 1</option>
                    <option value="period-2">Period 2</option>
                    <option value="period-3">Period 3</option>
                    <option value="period-4">Period 4</option>
                    <option value="period-5">Period 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Subject for slot</label>
                  <select
                    value={changePeriodDetails.newSubjectId}
                    onChange={(e) => setChangePeriodDetails(prev => ({ ...prev, newSubjectId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="">Select Subject...</option>
                    {subjectsList.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_code} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Teacher</label>
                  <select
                    value={changePeriodDetails.newTeacherId}
                    onChange={(e) => setChangePeriodDetails(prev => ({ ...prev, newTeacherId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="">Select Teacher...</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. LH-301 / Computer Lab 1"
                    value={changePeriodDetails.room}
                    onChange={(e) => setChangePeriodDetails(prev => ({ ...prev, room: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 3. ADD EXTRA PERIOD */}
            {overrideType === "ADD_PERIOD" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Extra Period Name</label>
                  <input
                    type="text"
                    value={addPeriodDetails.periodName}
                    onChange={(e) => setAddPeriodDetails(prev => ({ ...prev, periodName: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Timing (Start - End)</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={addPeriodDetails.startTime}
                      onChange={(e) => setAddPeriodDetails(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-1/2 px-2 py-2 text-xs font-medium rounded-xl border border-slate-200"
                    />
                    <input
                      type="time"
                      value={addPeriodDetails.endTime}
                      onChange={(e) => setAddPeriodDetails(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-1/2 px-2 py-2 text-xs font-medium rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={addPeriodDetails.subjectId}
                    onChange={(e) => setAddPeriodDetails(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="">Select Subject...</option>
                    {subjectsList.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teacher</label>
                  <select
                    value={addPeriodDetails.teacherId}
                    onChange={(e) => setAddPeriodDetails(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="">Select Teacher...</option>
                    {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* 4. CHANGE TIMINGS */}
            {overrideType === "CHANGE_TIMINGS" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Timing Alteration</label>
                  <input
                    type="text"
                    value={changeTimingsDetails.reason}
                    onChange={(e) => setChangeTimingsDetails(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
                <div className="text-[11px] font-bold text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  Note: Classes on this date will run on shortened 40-minute periods to accommodate assembly/event schedule.
                </div>
              </div>
            )}

            {/* 5. HOLIDAY */}
            {overrideType === "HOLIDAY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Type</label>
                  <select
                    value={holidayDetails.holidayCategory}
                    onChange={(e) => setHolidayDetails(prev => ({ ...prev, holidayCategory: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="WEATHER">Inclement Weather / Rain Day</option>
                    <option value="INSTITUTIONAL">Institutional Holiday</option>
                    <option value="EMERGENCY">Emergency Off Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Reason</label>
                  <input
                    type="text"
                    value={holidayDetails.reason}
                    onChange={(e) => setHolidayDetails(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 6. HALF DAY */}
            {overrideType === "HALF_DAY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Half Day Session</label>
                  <select
                    value={halfDayDetails.sessionType}
                    onChange={(e) => setHalfDayDetails(prev => ({ ...prev, sessionType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="MORNING">Morning Classes Only (08:30 - 12:45)</option>
                    <option value="AFTERNOON">Afternoon Classes Only (13:45 - 16:45)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={halfDayDetails.reason}
                    onChange={(e) => setHalfDayDetails(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 7. EXAM / EVENT */}
            {overrideType === "EXAM_DAY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Category</label>
                  <select
                    value={examEventDetails.eventType}
                    onChange={(e) => setExamEventDetails(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="EXAM">Examinations</option>
                    <option value="CULTURAL">Cultural Fest</option>
                    <option value="SPORTS">Sports Meet</option>
                    <option value="WORKSHOP">Seminar / Symposium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={examEventDetails.eventName}
                    onChange={(e) => setExamEventDetails(prev => ({ ...prev, eventName: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 8. DAY SWAP */}
            {overrideType === "DAY_SWAP" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operate on Timetable of:</label>
                  <select
                    value={daySwapDetails.sourceDay}
                    onChange={(e) => setDaySwapDetails(prev => ({ ...prev, sourceDay: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  >
                    <option value="MON">Monday Timetable</option>
                    <option value="TUE">Tuesday Timetable</option>
                    <option value="WED">Wednesday Timetable</option>
                    <option value="THU">Thursday Timetable</option>
                    <option value="FRI">Friday Timetable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={daySwapDetails.reason}
                    onChange={(e) => setDaySwapDetails(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 shadow-md shadow-indigo-500/20 transition-all"
            >
              {initialData ? "Save Changes" : "Apply Override"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
