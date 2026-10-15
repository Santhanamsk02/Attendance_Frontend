import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  Clock,
  UserCheck,
  PlusCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Building,
  CheckCircle,
  Info,
  Save,
  Check,
  User,
  BookOpen,
  MapPin,
  RefreshCw,
  Plus,
  Grid,
  ListFilter,
  CheckSquare,
  Search,
  Trash2,
  X
} from "lucide-react";
import { apiClient } from "../../services/api";
import { calendarService } from "../../services/calendarService";
import { timetableService } from "../../services/timetableService";
import { teacherService } from "../../services/teacherService";
import { subjectService } from "../../services/subjectService";
import { useToast } from "../../hooks/useToast";

const OVERRIDE_TYPES = [
  { id: "SUBSTITUTE_STAFF", label: "Substitute Staff", icon: UserCheck, desc: "Assign substitute staff for specific period(s)" },
  { id: "CHANGE_PERIOD", label: "Change / Swap Period", icon: Layers, desc: "Swap subject, teacher, or room for specific period(s)" },
  { id: "ADD_PERIOD", label: "Add Extra Period", icon: PlusCircle, desc: "Add 0th period or late evening extra period" },
  { id: "CHANGE_TIMINGS", label: "Change Bell Timings", icon: Clock, desc: "Alter start and end times for period slots" },
  { id: "HOLIDAY", label: "Declare Holiday", icon: AlertTriangle, desc: "Full day holiday (Festival, Rain day, Emergency)" },
  { id: "HALF_DAY", label: "Half Day", icon: Calendar, desc: "Morning or Afternoon half-day session" },
  { id: "EXAM_DAY", label: "Exam / Event Schedule", icon: Sparkles, desc: "Mid-term exam or annual cultural fest schedule" },
  { id: "DAY_SWAP", label: "Day Schedule Swap", icon: ArrowRight, desc: "Run a Saturday on a Monday's timetable" }
];

export default function CalendarOverridePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [editId, setEditId] = useState(searchParams.get("id"));
  const initStartDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];
  const initEndDate = searchParams.get("endDate") || initStartDate;

  // Wizard Step (1, 2, 3)
  const [step, setStep] = useState(1);

  // Step 1 State
  const [overrideType, setOverrideType] = useState("SUBSTITUTE_STAFF");
  const [startDate, setStartDate] = useState(initStartDate);
  const [endDate, setEndDate] = useState(initEndDate);
  const [title, setTitle] = useState("");
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showHalfDayModal, setShowHalfDayModal] = useState(false);
  const [showDaySwapModal, setShowDaySwapModal] = useState(false);
  const [notes, setNotes] = useState("");

  // Step 2 State (Sequential DB Cohort Cascade)
  const [scope, setScope] = useState("SECTION"); // ALL, DEPT, SECTION
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  
  const [semester, setSemester] = useState("5");
  const [availableSections, setAvailableSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");

  // Step 3 State (Timetable Cards & Period Overrides)
  const [activeDay, setActiveDay] = useState("MON");
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [baselineGrid, setBaselineGrid] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected period overrides in Step 3
  const [periodOverrides, setPeriodOverrides] = useState({});
  const [activePeriod, setActivePeriod] = useState(null);

  // Global override fields
  const [holidayCategory, setHolidayCategory] = useState("FESTIVAL");
  const [halfDaySession, setHalfDaySession] = useState("MORNING");
  const [eventName, setEventName] = useState("Mid-Semester Examinations");
  const [sourceDay, setSourceDay] = useState("MON");

  // Helper to convert YYYY-MM-DD to weekday code (MON, TUE, etc.)
  const getDayOfWeekCode = (dateStr) => {
    if (!dateStr) return "MON";
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayIdx = dateObj.getDay();
    const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const code = dayMap[dayIdx];
    return code === "SUN" ? "MON" : code;
  };

  const getDayLabel = (code) => {
    const map = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
    return map[code] || code;
  };

  // Automatically align activeDay with startDate when date changes
  useEffect(() => {
    if (startDate) {
      setActiveDay(getDayOfWeekCode(startDate));
    }
  }, [startDate]);


  // 1. Fetch Departments from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/institution/departments");
        setDepartments(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch departments from DB", e);
      }
    })();
  }, []);

  // 2. Cascade: Fetch Batches when selectedDept changes
  useEffect(() => {
    if (!selectedDept) {
      setAvailableBatches([]);
      setSelectedBatch("");
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get(`/institution/departments/${selectedDept}/batches`);
        setAvailableBatches(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch batches from DB", e);
        setAvailableBatches([]);
      }
    })();
  }, [selectedDept]);

  // 3. Cascade: Fetch Sections when selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) {
      setAvailableSections([]);
      setSelectedSection("");
      setSemester("");
      return;
    }
    const bObj = availableBatches.find(b => b.id === selectedBatch || b.batch_name === selectedBatch);
    if (bObj && bObj.current_semester) {
      setSemester(String(bObj.current_semester));
    }
    
    (async () => {
      try {
        const batchIdToFetch = bObj?.id || selectedBatch;
        const res = await apiClient.get(`/institution/batches/${batchIdToFetch}/sections`);
        setAvailableSections(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch sections from DB", e);
        setAvailableSections([]);
      }
    })();
  }, [selectedBatch, availableBatches]);

  const handleDepartmentChange = (val) => {
    setSelectedDept(val);
    setSelectedBatch("");
    setSelectedSection("");
  };

  const handleBatchChange = (val) => {
    setSelectedBatch(val);
    setSelectedSection("");
  };

  // Load DB Teachers and Subjects
  useEffect(() => {
    (async () => {
      try {
        const tRes = await teacherService.getTeachers({ limit: 100 });
        const items = Array.isArray(tRes) ? tRes : (tRes.items || tRes.data || []);
        setTeachers(items);
      } catch (e) {
        console.warn("Failed to fetch teachers from DB", e);
        setTeachers([]);
      }
      try {
        const sRes = await subjectService.getSubjects({ limit: 100 });
        const items = Array.isArray(sRes) ? sRes : (sRes.items || sRes.data || []);
        setSubjects(items);
      } catch (e) {
        console.warn("Failed to fetch subjects from DB", e);
        setSubjects([]);
      }
    })();
  }, []);


  // Auto-fetch existing override for the selected date and cohort scope if editId is not explicit
  useEffect(() => {
    if (editId || !startDate || !selectedDept) return;
    (async () => {
      try {
        const res = await calendarService.getOverrides({
          start_date: startDate,
          end_date: endDate || startDate,
          department_id: selectedDept,
          section_name: scope === "SECTION" ? selectedSection : undefined
        });
        const items = res?.items || (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          const matched = items.find(i => 
            i.start_date === startDate && 
            (!i.section_name || i.section_name === selectedSection)
          ) || items[0];

          if (matched) {
            setEditId(matched.id);
            setTitle(matched.title || "");
            // DO NOT forcefully overwrite the user's Step 1 selection during auto-fetch cascade
            // setOverrideType(matched.override_type || "SUBSTITUTE_STAFF");
            let parsedDetails = {};
            try {
              parsedDetails = typeof matched.details === 'string' ? JSON.parse(matched.details) : (matched.details || {});
            } catch (err) {
              console.warn("Failed to parse details JSON", err);
            }
            if (parsedDetails.periodOverrides) setPeriodOverrides(parsedDetails.periodOverrides);
            if (parsedDetails.holidayCategory) setHolidayCategory(parsedDetails.holidayCategory);
            if (parsedDetails.halfDaySession) setHalfDaySession(parsedDetails.halfDaySession);
            if (parsedDetails.eventName) setEventName(parsedDetails.eventName);
            if (parsedDetails.sourceDay) setSourceDay(parsedDetails.sourceDay);
            if (parsedDetails.notes) setNotes(parsedDetails.notes);
            toast.info(`Found existing saved override for ${startDate}. Loaded configuration.`);
          }
        }
      } catch (e) {
        console.warn("Could not check existing override", e);
      }
    })();
  }, [startDate, endDate, selectedDept, selectedSection, scope, editId]);

  // Load edit item ONLY if id is provided in URL on initial mount
  useEffect(() => {
    const urlId = searchParams.get("id");
    if (!urlId) return;
    (async () => {
      try {
        const item = await calendarService.getOverrides();
        const found = (item || []).find(i => i.id === urlId);
        if (found) {
          setTitle(found.title || "");
          setOverrideType(found.override_type || "SUBSTITUTE_STAFF");
          setStartDate(found.start_date || "");
          setEndDate(found.end_date || found.start_date || "");
          if (found.department_id) setSelectedDept(found.department_id);
          if (found.academic_year || found.batch_id) setSelectedBatch(found.academic_year || found.batch_id);
          if (found.semester) setSemester(String(found.semester));
          if (found.section_name) setSelectedSection(found.section_name);
          let parsedDetails = {};
          try {
            parsedDetails = typeof found.details === 'string' ? JSON.parse(found.details) : (found.details || {});
          } catch (err) {
            console.warn("Failed to parse details JSON", err);
          }
          if (parsedDetails.periodOverrides) setPeriodOverrides(parsedDetails.periodOverrides);
          if (parsedDetails.holidayCategory) setHolidayCategory(parsedDetails.holidayCategory);
          if (parsedDetails.halfDaySession) setHalfDaySession(parsedDetails.halfDaySession);
          if (parsedDetails.eventName) setEventName(parsedDetails.eventName);
          if (parsedDetails.sourceDay) setSourceDay(parsedDetails.sourceDay);
          if (parsedDetails.notes) setNotes(parsedDetails.notes);
        }
      } catch (e) {
        console.error("Failed to load edit override", e);
      }
    })();
  }, [searchParams]);

  // Fetch Section baseline timetable when entering Step 3
  const fetchSectionTimetable = useCallback(async () => {
    if (!selectedDept || !selectedBatch || !selectedSection) return;
    setLoadingTimetable(true);
    try {
      const batchObj = availableBatches.find(b => b.id === selectedBatch || b.batch_name === selectedBatch);
      const data = await timetableService.loadDraft({
        department: selectedDept,
        academic_year: batchObj ? batchObj.batch_name : selectedBatch,
        semester: parseInt(semester, 10),
        section: selectedSection
      });
      setBaselineGrid(data || null);
    } catch (e) {
      console.warn("No baseline timetable found for section", e);
      setBaselineGrid(null);
    } finally {
      setLoadingTimetable(false);
    }
  }, [selectedDept, selectedBatch, semester, selectedSection]);

  const handleNextToStep3 = () => {
    if (scope === "SECTION") {
      fetchSectionTimetable();
    }
    setStep(3);
  };

  // Configure a period slot in Step 3
  const handleSavePeriodCellOverride = (periodId, details) => {
    setPeriodOverrides(prev => ({
      ...prev,
      [periodId]: details
    }));
    setActivePeriod(null);
    toast.success(`Override set for ${periodId.replace("-", " ").toUpperCase()}`);
  };

  const handleRemovePeriodCellOverride = (periodId) => {
    setPeriodOverrides(prev => {
      const updated = { ...prev };
      delete updated[periodId];
      return updated;
    });
    setActivePeriod(null);
  };

  // Final Submit
  const handleFinalSave = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select valid Start and End dates.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End Date cannot be earlier than Start Date.");
      return;
    }

    let defaultTitle = title.trim();
    if (!defaultTitle) {
      const typeLabel = OVERRIDE_TYPES.find(t => t.id === overrideType)?.label || "Override";
      defaultTitle = `${typeLabel} (${startDate === endDate ? startDate : `${startDate} to ${endDate}`})`;
    }

    // Build clean type-specific details dictionary
    let cleanDetails = { notes };
    if (overrideType === "HOLIDAY") {
      cleanDetails.holidayCategory = holidayCategory;
    } else if (overrideType === "HALF_DAY") {
      cleanDetails.halfDaySession = halfDaySession;
    } else if (overrideType === "EXAM_DAY") {
      cleanDetails.eventName = eventName;
    } else if (overrideType === "DAY_SWAP") {
      cleanDetails.sourceDay = sourceDay;
    } else {
      cleanDetails.periodOverrides = periodOverrides;
    }

    const payload = {
      title: defaultTitle,
      override_type: overrideType,
      start_date: startDate,
      end_date: endDate,
      department_id: scope === "ALL" ? null : selectedDept,
      batch_id: scope === "ALL" ? null : (availableBatches.find(b => b.id === selectedBatch)?.id || selectedBatch),
      academic_year: scope === "ALL" ? null : (availableBatches.find(b => b.id === selectedBatch)?.batch_name || selectedBatch),
      semester: scope === "ALL" ? null : parseInt(semester, 10),
      section_name: scope === "ALL" || scope === "DEPT" ? null : selectedSection,
      details: cleanDetails
    };

    try {
      if (editId) {
        await calendarService.updateOverride(editId, payload);
        toast.success("Calendar override updated successfully!");
      } else {
        await calendarService.createOverride(payload);
        toast.success("Calendar override applied successfully!");
      }
      navigate("/calendar");
    } catch (e) {
      toast.error("Failed to save calendar override.");
    }
  };

  return (
    <div className="space-y-6 pb-24">

      {/* ── Breadcrumbs & Back Bar ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/calendar")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Academic Calendar
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
          Override Wizard
        </span>
      </div>

      {/* ── Stepper Navigation Bar ──────────────────────────── */}
      <div className="rounded-3xl neu-card p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">

          {/* Step 1 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep(1)}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
              step === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : step > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-black text-slate-800">1. Configuration</span>
              <span className="block text-[10px] text-slate-400 font-semibold">Type & Dates</span>
            </div>
          </div>

          <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > 1 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => step >= 2 && setStep(2)}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
              step === 2 ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : step > 2 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {step > 2 ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-black text-slate-800">2. DB Cascade Scope</span>
              <span className="block text-[10px] text-slate-400 font-semibold">Dept → Batch → Section</span>
            </div>
          </div>

          <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => step >= 3 && setStep(3)}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
              step === 3 ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-slate-200 text-slate-500"
            }`}>
              3
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-black text-slate-800">3. Timetable Cards</span>
              <span className="block text-[10px] text-slate-400 font-semibold">Period Card Overrides</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── STEP 1: OVERRIDE TYPE & DATES ──────────────────── */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl neu-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Step 1: Choose Override Configuration & Date Range</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select the type of exception you want to create for attendance and timetable management.</p>
            </div>

            {/* Type Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OVERRIDE_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = overrideType === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setOverrideType(t.id);
                      if (t.id === "HOLIDAY" && !editId) setShowHolidayModal(true);
                      if (t.id === "HALF_DAY" && !editId) setShowHalfDayModal(true);
                      if (t.id === "DAY_SWAP" && !editId) setShowDaySwapModal(true);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{t.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
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
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  End Date (Multi-day Range Override) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Custom Title & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Override Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Substitute staff for Prof. John / Sports Day Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes / Circular Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Approved by Dean Academics (Ref: CIR/2026/08)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold neu-btn-primary rounded-2xl shadow-lg shadow-indigo-500/20"
            >
              Proceed to Step 2: Cohort Scope <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: SEQUENTIAL DB CASCADING SCOPE SELECTION ────────────────── */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl neu-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Step 2: Department → Batch → Section DB Cascade</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select department to query its academic batches from DB, then select batch to retrieve its available sections.</p>
            </div>

            {/* Scope Type Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "ALL", label: "Entire Institution", desc: "Applies to all departments, teachers & students" },
                { id: "DEPT", label: "Department-wide", desc: "Applies across all sections of a specific department" },
                { id: "SECTION", label: "Specific Section", desc: "Section-wise timetable override (Substitute, Period Swap, Timings)" }
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setScope(s.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    scope === s.id
                      ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-xs font-black">{s.label}</span>
                  <span className="block text-[11px] text-slate-500 mt-1 font-medium">{s.desc}</span>
                </div>
              ))}
            </div>

            {/* Sequential DB Cascade Forms */}
            {scope !== "ALL" && (
              <div className="p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-6">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Sequential Database Entity Cascade
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* 1. SELECT DEPARTMENT */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                      Select Department (from DB)
                    </div>
                    <select
                      value={selectedDept}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
        
                  </div>

                  {/* 2. SELECT ACADEMIC BATCH */}
                  <div className={`p-4 rounded-2xl border shadow-sm space-y-2 transition-all ${
                    selectedDept ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60 pointer-events-none"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                      Select Academic Batch
                    </div>
                    <select
                      value={selectedBatch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      disabled={!selectedDept}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Batch --</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          Batch {b.batch_name} (Sem {b.current_semester || 5})
                        </option>
                      ))}
                    </select>
            
                  </div>

                  {/* 3. SELECT SECTION */}
                  {scope === "SECTION" && (
                    <div className={`p-4 rounded-2xl border shadow-sm space-y-2 transition-all ${
                      selectedBatch ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60 pointer-events-none"
                    }`}>
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                        Select Section
                      </div>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={!selectedBatch}
                        className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Section --</option>
                        {availableSections.map(sec => {
                          return (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          );
                        })}
                      </select>
            
                    
                    </div>
                  )}


                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Back to Step 1
            </button>
            <button
              onClick={handleNextToStep3}
              disabled={scope === "SECTION" && (!selectedDept || !selectedBatch || !selectedSection)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold neu-btn-primary rounded-2xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              Proceed to Timetable Cards <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: VISUAL SECTION TIMETABLE PERIOD CARDS BOARD ── */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl neu-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Step 3: Section Timetable Board & Period Slot Overrides
                </h3>
  
              </div>

              {scope === "SECTION" && (
                <button
                  onClick={fetchSectionTimetable}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-2xl transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTimetable ? "animate-spin" : ""}`} />
                  Refresh Baseline Timetable
                </button>
              )}
            </div>

            {/* Global Settings Summary */}
            {["HOLIDAY", "HALF_DAY", "EXAM_DAY", "DAY_SWAP"].includes(overrideType) && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {OVERRIDE_TYPES.find(t => t.id === overrideType)?.label} Configuration Details
                </h4>

                {overrideType === "HOLIDAY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div>Category: <span className="text-rose-700">{holidayCategory}</span></div>
                  </div>
                )}

                {overrideType === "HALF_DAY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div>Active Half-day Session: <span className="text-purple-700">{halfDaySession}</span></div>
                  </div>
                )}

                {overrideType === "EXAM_DAY" && (
                  <div className="text-xs font-bold">
                    Event / Exam Title: <span className="text-cyan-700">{eventName}</span>
                  </div>
                )}

                {overrideType === "DAY_SWAP" && (
                  <div className="text-xs font-bold">
                    Operate on Timetable of: <span className="text-teal-700">{sourceDay} Schedule</span>
                  </div>
                )}
              </div>
            )}

            {/* ── VISUAL CARD BOARD FOR TIMETABLE ── */}
            {scope === "SECTION" && (
              <div className="space-y-5">

                {/* Target Day Indicator Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-indigo-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
                      <Calendar className="w-5 h-5 text-indigo-100" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-100">
                        Target Date: <span className="text-white font-extrabold">{startDate}</span> ({getDayLabel(getDayOfWeekCode(startDate))})
                      </h4>
                      <p className="text-[11px] text-indigo-200 font-medium">
                        {(() => {
                          const d = departments.find(d => d.id === selectedDept) || {};
                          const b = availableBatches.find(b => b.id === selectedBatch) || {};
                          const s = availableSections.find(s => s.id === selectedSection) || {};
                          const yrRoman = ["I", "II", "III", "IV", "V"][b.current_year - 1] || b.current_year || "";
                          const label = `${d.code || selectedDept} ${yrRoman}-${s.id || selectedSection}`;
                          return (
                            <>Showing <strong className="text-white">{getDayLabel(activeDay)}</strong> Baseline Schedule for <strong className="text-white">{label}</strong>.</>
                          );
                        })()}
                      </p>
                    </div>
                  </div>


                  <span className="text-xs font-black bg-white/20 backdrop-blur-xs px-3 py-1.5 rounded-xl self-start sm:self-auto border border-white/20">
                    {Object.keys(periodOverrides).length} Overrides Active
                  </span>
                </div>



                {loadingTimetable ? (
                  <div className="p-16 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                    <p className="text-xs font-bold">Fetching Section Timetable from DB...</p>
                  </div>
                ) : !baselineGrid ? (
                  <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-200 text-center">
                    <Info className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-xs font-extrabold text-amber-800">No configured baseline timetable found in DB for Sec {selectedSection}.</p>
                    <p className="text-[11px] text-amber-600 mt-1">You can still save general date overrides or setup baseline timetable in Timetable page.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {(() => {
                        const defaultTimeline = [
                          { id: "period-1", label: "Period 1", start: "08:30", end: "09:30" },
                          { id: "period-2", label: "Period 2", start: "09:30", end: "10:30" },
                          { id: "period-3", label: "Period 3", start: "10:45", end: "11:45" },
                          { id: "period-4", label: "Period 4", start: "11:45", end: "12:45" },
                          { id: "period-5", label: "Period 5", start: "13:45", end: "14:45" },
                        ];
                        
                        const baseTimeline = (baselineGrid.timeline || defaultTimeline).filter(t => t.type !== "break");
                        
                        const extraPeriods = Object.entries(periodOverrides)
                          .filter(([id]) => id.startsWith("extra-"))
                          .map(([id, details]) => ({
                            id,
                            label: details.label || "Extra Period",
                            start: details.start || "16:00",
                            end: details.end || "17:00",
                            isExtra: true
                          }));
                          
                        const combinedTimeline = [...baseTimeline, ...extraPeriods];

                        return combinedTimeline.map((item, idx) => {
                          const existingOv = periodOverrides[item.id];
                          const dayObj = (baselineGrid.days || []).find(d => d.day === activeDay) || {};
                          const cellEntry = (dayObj.entries || []).find(e => e.timeline_item_id === item.id || e.start_timeline_item_id === item.id);
                          const isLab = cellEntry && (cellEntry.session_type === "lab" || cellEntry.session_type === "practical");

                          const SUBTLE_THEMES = [
                            {
                              card: "bg-gradient-to-br from-indigo-50/90 via-slate-50 to-indigo-100/40 border-indigo-200/90 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10",
                              headerBorder: "border-indigo-100",
                              headerText: "text-indigo-950",
                              timeBg: "bg-indigo-100/80 text-indigo-700",
                              subjectBadge: "bg-indigo-100 text-indigo-900 border-indigo-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-indigo-900/80",
                              btn: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                            },
                            {
                              card: "bg-gradient-to-br from-sky-50/90 via-slate-50 to-sky-100/40 border-sky-200/90 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10",
                              headerBorder: "border-sky-100",
                              headerText: "text-sky-950",
                              timeBg: "bg-sky-100/80 text-sky-700",
                              subjectBadge: "bg-sky-100 text-sky-900 border-sky-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-sky-900/80",
                              btn: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                            },
                            {
                              card: "bg-gradient-to-br from-emerald-50/90 via-slate-50 to-emerald-100/40 border-emerald-200/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10",
                              headerBorder: "border-emerald-100",
                              headerText: "text-emerald-950",
                              timeBg: "bg-emerald-100/80 text-emerald-700",
                              subjectBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-emerald-900/80",
                              btn: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            },
                            {
                              card: "bg-gradient-to-br from-purple-50/90 via-slate-50 to-purple-100/40 border-purple-200/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10",
                              headerBorder: "border-purple-100",
                              headerText: "text-purple-950",
                              timeBg: "bg-purple-100/80 text-purple-700",
                              subjectBadge: "bg-purple-100 text-purple-900 border-purple-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-purple-900/80",
                              btn: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                            },
                            {
                              card: "bg-gradient-to-br from-amber-50/90 via-slate-50 to-amber-100/40 border-amber-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10",
                              headerBorder: "border-amber-100",
                              headerText: "text-amber-950",
                              timeBg: "bg-amber-100/80 text-amber-700",
                              subjectBadge: "bg-amber-100 text-amber-900 border-amber-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-amber-900/80",
                              btn: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                            },
                            {
                              card: "bg-gradient-to-br from-teal-50/90 via-slate-50 to-teal-100/40 border-teal-200/90 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10",
                              headerBorder: "border-teal-100",
                              headerText: "text-teal-950",
                              timeBg: "bg-teal-100/80 text-teal-700",
                              subjectBadge: "bg-teal-100 text-teal-900 border-teal-200",
                              subjectText: "text-slate-900",
                              teacherText: "text-teal-900/80",
                              btn: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                            }
                          ];

                          const theme = existingOv
                            ? {
                                card: "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400",
                                headerBorder: "border-white/20",
                                headerText: "text-white",
                                timeBg: "bg-white/20 text-white",
                                subjectBadge: "bg-white/20 text-white border-white/30",
                                subjectText: "text-white",
                                teacherText: "text-indigo-100",
                                btn: "bg-white text-indigo-900 hover:bg-slate-100 font-black shadow-sm"
                              }
                            : SUBTLE_THEMES[idx % SUBTLE_THEMES.length];

                          return (
                            <div
                              key={item.id}
                              className={`rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between relative group ${theme.card}`}
                            >
                              <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${theme.headerBorder}`}>
                                <span className={`text-xs font-black uppercase tracking-wider ${theme.headerText}`}>
                                  {item.label || item.id}
                                </span>
                                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${theme.timeBg}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {item.start} - {item.end}
                                </span>
                              </div>

                              <div className="space-y-3 flex-1 mb-4">
                                {cellEntry || item.isExtra ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${theme.subjectBadge}`}>
                                        <BookOpen className="w-4 h-4 shrink-0 opacity-90" />
                                        <span>{cellEntry ? cellEntry.subject_code : (existingOv ? existingOv.newSubjectCode : "EXTRA")}</span>
                                      </div>
                                      {isLab && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-xs">LAB</span>
                                      )}
                                    </div>

                                    <h5 className={`text-base sm:text-lg font-black leading-snug line-clamp-2 ${theme.subjectText}`}>
                                      {cellEntry ? (cellEntry.subject_name || cellEntry.subject_code) : (existingOv ? (existingOv.newSubjectName || existingOv.newSubjectCode) : "Unassigned Extra Period")}
                                    </h5>

                                    <div className={`flex items-center gap-2 text-sm sm:text-base font-extrabold pt-1 ${theme.teacherText}`}>
                                      <User className="w-4 h-4 shrink-0 opacity-80" />
                                      <span className="truncate">{cellEntry ? (cellEntry.teacher_name || "Faculty Assigned") : (existingOv ? existingOv.newTeacherName : "Unassigned Faculty")}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="py-6 text-center italic text-xs font-extrabold text-slate-400">
                                    Unassigned Period Slot
                                  </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                                  {existingOv ? (
                                    <div className="flex-1 pr-2">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-0.5">Active Override</div>
                                      <div className="text-xs font-bold leading-tight line-clamp-2">{existingOv.description}</div>
                                    </div>
                                  ) : null}
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setActivePeriod({ item, cellEntry })}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${theme.btn} ${existingOv ? 'py-1.5 px-3' : 'w-full'}`}
                                    >
                                      {existingOv ? "Modify" : <><Plus className="w-3.5 h-3.5" /> Configure</>}
                                    </button>
                                    
                                    {existingOv && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemovePeriodCellOverride(item.id);
                                        }}
                                        className="p-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        });
                      })()}
                    </div>

                    {overrideType === "ADD_PERIOD" && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => {
                            const newId = `extra-${Date.now()}`;
                            setActivePeriod({
                              item: { id: newId, label: "Extra Period", start: "16:00", end: "17:00", isExtra: true },
                              cellEntry: null
                            });
                          }}
                          className="px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-xs inline-flex items-center gap-2 border border-indigo-200 transition-all shadow-sm"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add New Extra Period Slot
                        </button>
                      </div>
                    )}
                  </>




                )}
              </div>
            )}

          </div>

          {/* ── Action Buttons Footer ────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Back to Step 2
            </button>

            <button
              onClick={handleFinalSave}
              className="inline-flex items-center gap-2 px-7 py-3 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              Save & Apply Calendar Override
            </button>
          </div>
        </div>
      )}

      {/* ── Active Period Drawer / Modal for Step 3 Cell Config ── */}
      {activePeriod && (
        <PeriodCellOverrideModal
          periodItem={activePeriod.item}
          cellEntry={activePeriod.cellEntry}
          overrideType={overrideType}
          teachers={teachers}
          subjects={subjects}
          baselineGrid={baselineGrid}
          existingOv={periodOverrides[activePeriod.item.id]}
          onClose={() => setActivePeriod(null)}
          onSave={(details) => handleSavePeriodCellOverride(activePeriod.item.id, details)}
        />
      )}

      {/* ── Holiday Quick Modal ── */}
      {showHolidayModal && (
        <HolidayPopupModal
          defaultStart={startDate}
          defaultEnd={endDate}
          defaultTitle={title}
          defaultCategory={holidayCategory}
          onClose={() => setShowHolidayModal(false)}
          onSave={async (data) => {
            const payload = {
              title: data.name,
              override_type: "HOLIDAY",
              start_date: data.start,
              end_date: data.end,
              department_id: null,
              batch_id: null,
              academic_year: null,
              semester: null,
              section_name: null,
              details: { holidayCategory: data.category }
            };
            try {
              if (editId) {
                await calendarService.updateOverride(editId, payload);
                toast.success("Holiday updated successfully!");
              } else {
                await calendarService.createOverride(payload);
                toast.success("Holiday declared successfully!");
              }
              setShowHolidayModal(false);
              navigate("/calendar");
            } catch (e) {
              toast.error("Failed to declare holiday.");
            }
          }}
        />
      )}

      {/* ── Half Day Quick Modal ── */}
      {showHalfDayModal && (
        <HalfDayPopupModal
          defaultStart={startDate}
          defaultEnd={endDate}
          defaultTitle={title}
          defaultSession={halfDaySession}
          onClose={() => setShowHalfDayModal(false)}
          onSave={async (data) => {
            const payload = {
              title: data.name,
              override_type: "HALF_DAY",
              start_date: data.start,
              end_date: data.end,
              department_id: null,
              batch_id: null,
              academic_year: null,
              semester: null,
              section_name: null,
              details: { halfDaySession: data.session }
            };
            try {
              if (editId) {
                await calendarService.updateOverride(editId, payload);
                toast.success("Half day updated successfully!");
              } else {
                await calendarService.createOverride(payload);
                toast.success("Half day declared successfully!");
              }
              setShowHalfDayModal(false);
              navigate("/calendar");
            } catch (e) {
              toast.error("Failed to declare half day.");
            }
          }}
        />
      )}

      {/* ── Day Swap Quick Modal ── */}
      {showDaySwapModal && (
        <DaySwapPopupModal
          defaultStart={startDate}
          defaultEnd={endDate}
          defaultTitle={title}
          defaultSourceDay={sourceDay}
          onClose={() => setShowDaySwapModal(false)}
          onSave={async (data) => {
            const payload = {
              title: data.name,
              override_type: "DAY_SWAP",
              start_date: data.start,
              end_date: data.end,
              department_id: null,
              batch_id: null,
              academic_year: null,
              semester: null,
              section_name: null,
              details: { sourceDay: data.sourceDay }
            };
            try {
              if (editId) {
                await calendarService.updateOverride(editId, payload);
                toast.success("Day swap updated successfully!");
              } else {
                await calendarService.createOverride(payload);
                toast.success("Day schedule swapped successfully!");
              }
              setShowDaySwapModal(false);
              navigate("/calendar");
            } catch (e) {
              toast.error("Failed to swap day schedule.");
            }
          }}
        />
      )}

    </div>
  );
}

function DaySwapPopupModal({ defaultStart, defaultEnd, defaultTitle, defaultSourceDay, onClose, onSave }) {
  const [name, setName] = useState(defaultTitle || "");
  const [start, setStart] = useState(defaultStart || "");
  const [end, setEnd] = useState(defaultEnd || "");
  const [sourceDay, setSourceDay] = useState(defaultSourceDay || "MON");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 bg-teal-50 border-b border-teal-100 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-black text-teal-900">Day Schedule Swap</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Override Name <span className="text-teal-500">*</span></label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" 
              autoFocus 
              placeholder="e.g. Wednesday running Monday Order" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Target Start Date <span className="text-teal-500">*</span></label>
              <input type="date" value={start} onChange={e => {
                setStart(e.target.value);
                if (end < e.target.value) setEnd(e.target.value);
              }} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Target End Date <span className="text-teal-500">*</span></label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Source Day Timetable (To Implement)</label>
            <select value={sourceDay} onChange={e => setSourceDay(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="MON">Monday Schedule</option>
              <option value="TUE">Tuesday Schedule</option>
              <option value="WED">Wednesday Schedule</option>
              <option value="THU">Thursday Schedule</option>
              <option value="FRI">Friday Schedule</option>
              <option value="SAT">Saturday Schedule</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-4 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-extrabold text-slate-600">Cancel</button>
            <button 
              onClick={() => {
                if(!name.trim() || !start || !end) {
                  return;
                }
                onSave({ name, start, end, sourceDay });
              }} 
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 transition-colors text-white rounded-xl font-extrabold shadow-md shadow-teal-200"
            >
              Apply Swap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HalfDayPopupModal({ defaultStart, defaultEnd, defaultTitle, defaultSession, onClose, onSave }) {
  const [name, setName] = useState(defaultTitle || "");
  const [start, setStart] = useState(defaultStart || "");
  const [end, setEnd] = useState(defaultEnd || "");
  const [session, setSession] = useState(defaultSession || "MORNING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
          <Clock className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-black text-purple-900">Declare Half Day</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Override Name <span className="text-purple-500">*</span></label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500" 
              autoFocus 
              placeholder="e.g. Afternoon Off / Election Day" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Start Date <span className="text-purple-500">*</span></label>
              <input type="date" value={start} onChange={e => {
                setStart(e.target.value);
                if (end < e.target.value) setEnd(e.target.value);
              }} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">End Date <span className="text-purple-500">*</span></label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Active Session (Working)</label>
            <select value={session} onChange={e => setSession(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="MORNING">Morning (Working) / Afternoon Off</option>
              <option value="AFTERNOON">Afternoon (Working) / Morning Off</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-4 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-extrabold text-slate-600">Cancel</button>
            <button 
              onClick={() => {
                if(!name.trim() || !start || !end) {
                  return;
                }
                onSave({ name, start, end, session });
              }} 
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 transition-colors text-white rounded-xl font-extrabold shadow-md shadow-purple-200"
            >
              Declare Half Day
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HolidayPopupModal({ defaultStart, defaultEnd, defaultTitle, defaultCategory, onClose, onSave }) {
  const [name, setName] = useState(defaultTitle || "");
  const [start, setStart] = useState(defaultStart || "");
  const [end, setEnd] = useState(defaultEnd || "");
  const [category, setCategory] = useState(defaultCategory || "FESTIVAL");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <h3 className="text-lg font-black text-rose-900">Declare Holiday</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Holiday Name <span className="text-rose-500">*</span></label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" 
              autoFocus 
              placeholder="e.g. Diwali / Rain Holiday" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Start Date <span className="text-rose-500">*</span></label>
              <input type="date" value={start} onChange={e => {
                setStart(e.target.value);
                if (end < e.target.value) setEnd(e.target.value);
              }} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">End Date <span className="text-rose-500">*</span></label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option value="FESTIVAL">Festival / National Holiday</option>
              <option value="EMERGENCY">Emergency / Rain Holiday</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-4 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-extrabold text-slate-600">Cancel</button>
            <button 
              onClick={() => {
                if(!name.trim() || !start || !end) {
                  return; // Could add toast here
                }
                onSave({ name, start, end, category });
              }} 
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 transition-colors text-white rounded-xl font-extrabold shadow-md shadow-rose-200"
            >
              Declare Holiday
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodCellOverrideModal({ periodItem, cellEntry, overrideType, teachers, subjects, baselineGrid, existingOv, onClose, onSave }) {
  const [subTeacherId, setSubTeacherId] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [reason, setReason] = useState("Faculty Leave / Official Duty");
  const [newSubjId, setNewSubjId] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  
  const [customStart, setCustomStart] = useState(periodItem.start || "");
  const [customEnd, setCustomEnd] = useState(periodItem.end || "");

  const isTimingsOnly = overrideType === "CHANGE_TIMINGS";
  const showTimeInputs = periodItem.isExtra || isTimingsOnly;

  // Auto-assign teacher for extra period when subject changes
  useEffect(() => {
    if (periodItem.isExtra && newSubjId && baselineGrid && baselineGrid.days) {
      for (const day of baselineGrid.days) {
        const entry = (day.entries || []).find(e => e.subject_id === newSubjId);
        if (entry && entry.teacher_id) {
          setNewTeacherId(entry.teacher_id);
          break;
        }
      }
    }
  }, [newSubjId, periodItem.isExtra, baselineGrid]);

  const filteredTeachers = (teachers || []).filter(t => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (t.name || "").toLowerCase().includes(q);
    const empMatch = String(t.employee_id || "").toLowerCase().includes(q);
    const deptStr = (t.department && typeof t.department === 'object')
      ? (t.department.name || t.department.code || '')
      : String(t.department || t.department_id || '');
    const deptMatch = deptStr.toLowerCase().includes(q);
    return nameMatch || empMatch || deptMatch;
  });

  const handleApply = (e) => {
    e.preventDefault();

    let details = {};
    if (overrideType === "SUBSTITUTE_STAFF") {
      const subT = teachers.find(t => t.id === subTeacherId);
      details = {
        type: "Substitute",
        substituteTeacherId: subTeacherId,
        substituteTeacherName: subT ? subT.name : "Substitute Staff",
        reason,
        description: `Sub: ${subT ? subT.name : 'Staff'}`
      };
    } else if (overrideType === "CHANGE_PERIOD" || overrideType === "ADD_PERIOD" || overrideType === "CHANGE_TIMINGS") {
      const subj = subjects.find(s => s.id === newSubjId);
      const t = teachers.find(t => t.id === newTeacherId);
      
      if (overrideType === "CHANGE_TIMINGS") {
        details = {
          ...(existingOv || {}),
          type: existingOv ? existingOv.type : "Time Changed",
          description: existingOv ? existingOv.description : `Changed Timing: ${customStart} - ${customEnd}`,
          start: customStart,
          end: customEnd
        };
      } else {
        details = {
          type: periodItem.isExtra ? "Extra Period" : "Swapped",
          newSubjectId: newSubjId,
          newSubjectCode: subj ? subj.subject_code : "",
          newSubjectName: subj ? subj.subject_name : "",
          newTeacherId,
          newTeacherName: t ? t.name : "",
          description: periodItem.isExtra ? `Extra: ${subj ? subj.subject_name : 'Subject'} - ${t ? t.name : 'Faculty'}` : `Swap: ${subj ? subj.subject_name : 'Subject'} - ${t ? t.name : 'Faculty'}`,
          ...(periodItem.isExtra && {
            start: customStart,
            end: customEnd,
            label: "Extra Period"
          })
        };
      }
    } else {
      details = {
        type: "Custom Override",
        description: "Overridden"
      };
    }

    onSave(details);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-black text-slate-800">
              Configure {periodItem.label || periodItem.id} ({periodItem.start} - {periodItem.end})
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {cellEntry ? `Current: ${cellEntry.subject_code} (${cellEntry.teacher_name || 'Faculty'})` : 'Unassigned Period'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-4 text-xs">
          {overrideType === "SUBSTITUTE_STAFF" ? (
            <>
              <div className="space-y-2">
                <label className="block font-black text-slate-800">
                  Search & Select Substitute Teacher <span className="text-rose-500">*</span>
                </label>
                
                {/* Search Field */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search teacher by name, employee ID, or department..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filtered Teachers List */}
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic">
                      No teachers found matching "{teacherSearch}".
                    </div>
                  ) : (
                    filteredTeachers.map((t) => {
                      const isSelected = subTeacherId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSubTeacherId(t.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-600 text-white font-bold shadow-md"
                              : "hover:bg-white hover:shadow-xs text-slate-700 font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              isSelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                            }`}>
                              {t.name ? t.name.charAt(0).toUpperCase() : "T"}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs">{t.name}</div>
                              <div className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                                {t.employee_id || "EMP"} • {typeof t.department === 'object' ? (t.department.code || t.department.name) : (t.department || "Faculty")}
                              </div>
                            </div>
                          </div>

                          {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1">Reason for Substitution</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-semibold rounded-xl border border-slate-200"
                />
              </div>
            </>
          ) : (
            <>
              {showTimeInputs && (
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div>
                    <label className="block font-black text-slate-800 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-800 mb-1">End Time</label>
                    <input
                      type="time"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              )}
              {!isTimingsOnly && (
                <>
                  <div>
                    <label className="block font-black text-slate-800 mb-1">New Subject</label>
                    <select
                      value={newSubjId}
                      onChange={(e) => setNewSubjId(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-bold rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="">Select Subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.subject_name}{s.subject_title ? `, ${s.subject_title}` : ''} ({s.subject_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!periodItem.isExtra && (
                    <div>
                      <label className="block font-black text-slate-800 mb-1">New Faculty</label>
                      
                      {/* Search Field */}
                      <div className="relative mb-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Search teacher by name, employee ID, or department..."
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Filtered Teachers List */}
                      <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 p-1">
                        {filteredTeachers.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 italic">
                            No teachers found matching "{teacherSearch}".
                          </div>
                        ) : (
                          filteredTeachers.map((t) => {
                            const isSelected = newTeacherId === t.id;
                            return (
                              <div
                                key={t.id}
                                onClick={() => setNewTeacherId(t.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-indigo-600 text-white font-bold shadow-md"
                                    : "hover:bg-white hover:shadow-xs text-slate-700 font-semibold"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                    isSelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                                  }`}>
                                    {t.name ? t.name.charAt(0).toUpperCase() : "T"}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-xs">{t.name}</div>
                                    <div className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                                      {t.employee_id || "EMP"} • {typeof t.department === 'object' ? (t.department.code || t.department.name) : (t.department || "Faculty")}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-600 font-extrabold hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/20 hover:bg-indigo-700">Apply Override</button>
          </div>
        </form>
      </div>
    </div>
  );
}

