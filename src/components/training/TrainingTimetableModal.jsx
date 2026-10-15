import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import specialTrainingService from "../../services/specialTrainingService";
import { apiClient } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { DAYS, DEFAULT_TIMELINE } from "../../utils/constants";
import TrainingStaffStep from "./TrainingStaffStep";
import TrainingTopicPalette from "./TrainingTopicPalette";
import TrainingTimetableGrid from "./TrainingTimetableGrid";
import TrainingSlotModal from "./TrainingSlotModal";
import TimelineConfig from "../timetable/TimelineConfig";
import PeriodConfigModal from "../timetable/PeriodConfigModal";
import BreakConfigModal from "../timetable/BreakConfigModal";

let _counter = Date.now();
const uid = (prefix = "id") => `${prefix}-${++_counter}`;

const cloneTimeline = (tl) => (tl || []).map((item) => ({ ...item }));

const renumberPeriods = (tl) => {
  let num = 1;
  return tl.map((item) => {
    if (item.type === "period") {
      return { ...item, number: num, label: `Period ${num++}` };
    }
    return { ...item };
  });
};

export default function TrainingTimetableModal({
  isOpen,
  onClose,
  training,
  onUpdated,
}) {
  const { success, error: showError } = useToast();

  // Multi-step state: 1 = Staff & Topics Setup, 2 = Timetable Matrix & Structure
  const [currentStep, setCurrentStep] = useState(1);

  // Data states
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Timeline configuration states
  const [timeline, setTimeline] = useState(() => cloneTimeline(DEFAULT_TIMELINE));
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [periodModal, setPeriodModal] = useState({ open: false, item: null });
  const [breakModal, setBreakModal] = useState({ open: false, item: null });

  // Staff Pool (Teacher IDs selected in Step 1)
  const [staffPool, setStaffPool] = useState([]);

  // Database-persisted training subjects
  const [dbSubjects, setDbSubjects] = useState([]);

  // Palette topics list (derived from DB subjects)
  const [paletteTopics, setPaletteTopics] = useState([]);

  // Slot modal state for click-to-schedule / edit
  const [slotModalState, setSlotModalState] = useState({
    isOpen: false,
    slotData: null,
  });

  // Fetch timetable slots, teachers, subjects & timeline structure
  const loadData = useCallback(async () => {
    if (!training?.id) return;
    setLoading(true);
    try {
      const [slotData, teacherData, subjectData, timelineData] = await Promise.all([
        specialTrainingService.getTimetable(training.id),
        apiClient.get("/teachers/?limit=500"),
        specialTrainingService.getSubjects(training.id),
        specialTrainingService.getTimelineStructure(training.id).catch(() => null),
      ]);

      setSlots(slotData || []);
      setDbSubjects(subjectData || []);

      // Load timeline structure if previously saved in backend
      if (
        timelineData &&
        timelineData.timeline &&
        Array.isArray(timelineData.timeline) &&
        timelineData.timeline.length > 0
      ) {
        setTimeline(timelineData.timeline);
        setIncludeSaturday(Boolean(timelineData.include_saturday));
      } else {
        setTimeline(cloneTimeline(DEFAULT_TIMELINE));
        setIncludeSaturday(false);
      }

      const teacherItems = Array.isArray(teacherData.data)
        ? teacherData.data
        : teacherData.data?.items || [];
      setTeachers(teacherItems);

      // Collect existing staff assigned across existing slots to initialize staff pool
      const existingStaffIds = new Set();
      (slotData || []).forEach((slot) => {
        (slot.assigned_staff || []).forEach((staff) => {
          existingStaffIds.add(staff.id);
        });
      });

      // If existing slots have assigned staff, use them as initial pool
      setStaffPool((prev) => {
        if (prev.length > 0) return prev;
        if (existingStaffIds.size > 0) return Array.from(existingStaffIds);
        return [];
      });

      // Initialize palette topics from DB subjects
      if (subjectData && subjectData.length > 0) {
        setPaletteTopics(
          subjectData.map((s) => ({
            id: s.id,
            topic: s.name,
            code: s.code,
            trainer_name: s.trainer_name || training.trainer_name || "",
            venue: s.venue || training.venue || "",
            description: s.description || "",
          }))
        );
      } else {
        // Fallback to primary training title if no specific subjects created yet
        setPaletteTopics([
          {
            id: "topic-primary",
            topic: training.name || "Special Training",
            code: null,
            trainer_name: training.trainer_name || "",
            venue: training.venue || "",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load training timetable", err);
      showError("Failed to load timetable data.");
    } finally {
      setLoading(false);
    }
  }, [training?.id, training?.name, training?.trainer_name, training?.venue, showError]);

  useEffect(() => {
    if (isOpen && training?.id) {
      loadData();
      setCurrentStep(1);
    }
  }, [isOpen, training?.id, loadData]);

  // Persist timeline structure to backend
  const saveTimelineToBackend = async (newTimeline, sat) => {
    try {
      await specialTrainingService.saveTimelineStructure(training.id, {
        timeline: newTimeline,
        include_saturday: sat,
      });
      success("Timetable structure saved.");
    } catch (err) {
      console.error("Failed to save timeline structure", err);
      showError("Failed to save timetable structure.");
    }
  };

  // ── Timeline Structure Mutation Handlers ──────────────────
  const handleAddPeriod = (data, insertIdx) => {
    const newItem = {
      type: "period",
      id: uid("period"),
      number: 0,
      label: "",
      start: data.start || "09:00",
      end: data.end || "10:00",
    };
    const next = [...timeline];
    if (insertIdx !== null && insertIdx >= 0 && insertIdx < timeline.length) {
      next.splice(insertIdx + 1, 0, newItem);
    } else {
      next.push(newItem);
    }
    const renumbered = renumberPeriods(next);
    setTimeline(renumbered);
    saveTimelineToBackend(renumbered, includeSaturday);
  };

  const handleEditPeriod = (periodId, data) => {
    const next = timeline.map((item) =>
      item.id === periodId ? { ...item, start: data.start, end: data.end } : item
    );
    setTimeline(next);
    saveTimelineToBackend(next, includeSaturday);
  };

  const handleRemovePeriod = (periodId) => {
    const filtered = timeline.filter((i) => i.id !== periodId);
    const renumbered = renumberPeriods(filtered);
    setTimeline(renumbered);
    saveTimelineToBackend(renumbered, includeSaturday);
  };

  const handleAddBreak = (data, insertIdx) => {
    const newItem = {
      type: "break",
      id: uid("break"),
      label: data.label || "Break",
      breakType: data.breakType || "CUSTOM_BREAK",
      start: data.start || "",
      end: data.end || "",
    };
    const next = [...timeline];
    if (insertIdx !== null && insertIdx >= 0 && insertIdx < timeline.length) {
      next.splice(insertIdx + 1, 0, newItem);
    } else {
      next.push(newItem);
    }
    setTimeline(next);
    saveTimelineToBackend(next, includeSaturday);
  };

  const handleEditBreak = (breakId, data) => {
    const next = timeline.map((item) =>
      item.id === breakId
        ? {
            ...item,
            label: data.label || item.label,
            breakType: data.breakType || item.breakType,
            start: data.start || item.start,
            end: data.end || item.end,
          }
        : item
    );
    setTimeline(next);
    saveTimelineToBackend(next, includeSaturday);
  };

  const handleRemoveBreak = (breakId) => {
    const filtered = timeline.filter((i) => i.id !== breakId);
    setTimeline(filtered);
    saveTimelineToBackend(filtered, includeSaturday);
  };

  const handleToggleSaturday = () => {
    const nextSat = !includeSaturday;
    setIncludeSaturday(nextSat);
    saveTimelineToBackend(timeline, nextSat);
  };

  const activeDays = useMemo(() => {
    return includeSaturday ? DAYS : DAYS.filter((d) => d.value !== "SAT");
  }, [includeSaturday]);

  // Refresh slots only
  const handleRefreshSlots = async () => {
    setRefreshing(true);
    try {
      const slotData = await specialTrainingService.getTimetable(training.id);
      setSlots(slotData || []);
      success("Timetable refreshed.");
    } catch (err) {
      showError("Failed to refresh timetable.");
    } finally {
      setRefreshing(false);
    }
  };

  // Drag-and-drop slot placement
  const handleDropSlot = async (dayValue, item, payload) => {
    const periodCode = `P${item.number}`;
    const teacherIdsToAssign =
      payload.teacher_ids && payload.teacher_ids.length > 0
        ? payload.teacher_ids
        : staffPool;

    try {
      await specialTrainingService.saveTimetableSlot(training.id, {
        day_of_week: dayValue,
        period_id: periodCode,
        start_time: item.start || "09:00",
        end_time: item.end || "10:30",
        topic: payload.topic,
        trainer_name: payload.trainer_name || training.trainer_name,
        venue: payload.venue || training.venue,
        teacher_ids: teacherIdsToAssign,
      });

      success(`Scheduled "${payload.topic}" for ${dayValue} (${periodCode})`);
      const updatedSlots = await specialTrainingService.getTimetable(training.id);
      setSlots(updatedSlots || []);
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || err.message || "Failed to schedule slot");
    }
  };

  // Click on empty cell -> open modal
  const handleAssignSlot = (dayValue, item) => {
    const periodCode = `P${item.number}`;
    setSlotModalState({
      isOpen: true,
      slotData: {
        day_of_week: dayValue,
        period_id: periodCode,
        start_time: item.start,
        end_time: item.end,
        topic: training.name,
        trainer_name: training.trainer_name,
        venue: training.venue,
        teacher_ids: [...staffPool],
      },
    });
  };

  // Click on existing cell or edit button
  const handleEditSlot = (dayValue, item, slot) => {
    setSlotModalState({
      isOpen: true,
      slotData: {
        ...slot,
        start_time: slot.start_time || item.start,
        end_time: slot.end_time || item.end,
        teacher_ids:
          slot.assigned_staff?.map((s) => s.id) || slot.teacher_ids || [],
      },
    });
  };

  // Save slot from modal
  const handleSaveModalSlot = async (formData) => {
    await specialTrainingService.saveTimetableSlot(training.id, formData);
    success("Timetable slot saved successfully.");
    const updatedSlots = await specialTrainingService.getTimetable(training.id);
    setSlots(updatedSlots || []);
    if (onUpdated) onUpdated();
  };

  // Delete slot
  const handleDeleteSlot = async (slotId) => {
    try {
      await specialTrainingService.deleteTimetableSlot(training.id, slotId);
      success("Slot deleted successfully.");
      const updatedSlots = await specialTrainingService.getTimetable(training.id);
      setSlots(updatedSlots || []);
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || err.message || "Failed to delete slot");
    }
  };

  if (!isOpen || !training) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col w-screen h-screen overflow-hidden animate-fade-in">
      {/* ── Full Screen Header Bar ───────────────────────────────── */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs z-30">
        {/* Left: Back Button & Training Details */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title="Return to Special Trainings Setup"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Back to Trainings</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {training.name}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Full Timetable Editor
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                {training.batch_name || "Special Training"} • Multi-Department Concurrent Attendance • Venue: {training.venue || "Campus"}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Stepper Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              currentStep === 1
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                currentStep === 1
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </span>
            <span>Faculty Pool & Topics</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              currentStep === 2
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                currentStep === 2
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span>Timetable & Structure</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {slots.length} Slots Scheduled
            </span>
            <span>•</span>
            <span className="text-slate-600">
              {staffPool.length} Attendance Faculty Assigned
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshSlots}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh Slots"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body (Smooth Vertical Page Scrolling) ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-slate-100/70">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-bold text-slate-600">
              Loading training timetable & structure...
            </span>
          </div>
        ) : currentStep === 1 ? (
          /* Step 1: Faculty Pool & Training Topics Setup (Spacious Full Screen) */
          <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 mb-10">
            <TrainingStaffStep
              training={training}
              teachers={teachers}
              staffPool={staffPool}
              setStaffPool={setStaffPool}
              paletteTopics={paletteTopics}
              setPaletteTopics={setPaletteTopics}
              onProceed={() => setCurrentStep(2)}
            />
          </div>
        ) : (
          /* Step 2: Timetable Structure Modification & Drag-and-Drop Matrix */
          <div className="space-y-5 max-w-[1700px] mx-auto w-full pb-16">
            {/* Timeline Structure Configuration Bar */}
            <TimelineConfig
              timeline={timeline}
              onEditPeriod={(item) => setPeriodModal({ open: true, item })}
              onRemovePeriod={handleRemovePeriod}
              onAddPeriod={() => setPeriodModal({ open: true, item: null })}
              onEditBreak={(item) => setBreakModal({ open: true, item })}
              onRemoveBreak={handleRemoveBreak}
              onAddBreak={() => setBreakModal({ open: true, item: null })}
              includeSaturday={includeSaturday}
              onToggleSaturday={handleToggleSaturday}
            />

            {/* Split Drag-and-Drop Workspace */}
            <div className="flex flex-col xl:flex-row gap-5 items-start">
              {/* Left Column: Draggable Topic / Subject Palette (Sticky) */}
              <div className="w-full xl:w-80 shrink-0 sticky top-2 self-start z-10">
                <TrainingTopicPalette
                  topics={paletteTopics}
                  training={training}
                  staffPool={staffPool}
                />
              </div>

              {/* Right Column: Weekly Timetable Grid taking full remaining space */}
              <div className="flex-1 min-w-0 w-full">
                <TrainingTimetableGrid
                  timeline={timeline}
                  days={activeDays}
                  slots={slots}
                  onAssignSlot={handleAssignSlot}
                  onEditSlot={handleEditSlot}
                  onDropSlot={handleDropSlot}
                  onDeleteSlot={handleDeleteSlot}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Period Config Modal (Add/Edit Period Timing & Position) ── */}
      <PeriodConfigModal
        isOpen={periodModal.open}
        onClose={() => setPeriodModal({ open: false, item: null })}
        onSave={(data, insertIdx) => {
          if (periodModal.item) {
            handleEditPeriod(periodModal.item.id, data);
          } else {
            handleAddPeriod(data, insertIdx);
          }
        }}
        period={periodModal.item}
        timeline={timeline}
      />

      {/* ── Break Config Modal (Add/Edit Break Timing & Position) ─── */}
      <BreakConfigModal
        isOpen={breakModal.open}
        onClose={() => setBreakModal({ open: false, item: null })}
        onSave={(data, insertIdx) => {
          if (breakModal.item) {
            handleEditBreak(breakModal.item.id, data);
          } else {
            handleAddBreak(data, insertIdx);
          }
        }}
        breakItem={breakModal.item}
        timeline={timeline}
      />

      {/* ── Slot Configuration & Staff Assignment Modal ──────────── */}
      <TrainingSlotModal
        isOpen={slotModalState.isOpen}
        onClose={() => setSlotModalState({ isOpen: false, slotData: null })}
        slotData={slotModalState.slotData}
        teachers={teachers}
        staffPool={staffPool}
        training={training}
        dbSubjects={dbSubjects}
        timeline={timeline}
        days={activeDays}
        onSave={handleSaveModalSlot}
        onDelete={handleDeleteSlot}
      />
    </div>
  );
}
