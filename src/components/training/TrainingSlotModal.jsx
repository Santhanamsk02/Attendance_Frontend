import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  User,
  Users,
  MapPin,
  BookOpen,
  Check,
  Trash2,
  Save,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { DAYS } from "../../utils/constants";

const PERIOD_OPTIONS = [
  { id: "P1", label: "Period 1 (P1)" },
  { id: "P2", label: "Period 2 (P2)" },
  { id: "P3", label: "Period 3 (P3)" },
  { id: "P4", label: "Period 4 (P4)" },
  { id: "P5", label: "Period 5 (P5)" },
  { id: "P6", label: "Period 6 (P6)" },
  { id: "P7", label: "Period 7 (P7)" },
  { id: "P8", label: "Period 8 (P8)" },
];

export default function TrainingSlotModal({
  isOpen,
  onClose,
  slotData,
  teachers = [],
  staffPool = [],
  training = {},
  dbSubjects = [],
  timeline = [],
  days = [],
  onSave,
  onDelete,
}) {
  const [dayOfWeek, setDayOfWeek] = useState("MON");
  const [periodId, setPeriodId] = useState("P1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");

  const periodOptions = useMemo(() => {
    const periods = (timeline || []).filter((t) => t.type === "period");
    if (periods.length > 0) {
      return periods.map((p) => ({
        id: `P${p.number}`,
        label: `${p.label} (${p.start}–${p.end})`,
        start: p.start,
        end: p.end,
      }));
    }
    return PERIOD_OPTIONS;
  }, [timeline]);

  const daysOptions = useMemo(() => {
    return days && days.length > 0 ? days : DAYS;
  }, [days]);
  const [topic, setTopic] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [venue, setVenue] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(slotData?.id);

  // Sync state when slotData changes
  useEffect(() => {
    if (!isOpen) return;

    if (slotData) {
      setDayOfWeek(slotData.day_of_week || "MON");
      setPeriodId(slotData.period_id || "P1");
      setStartTime(slotData.start_time || "09:00");
      setEndTime(slotData.end_time || "10:30");
      setTopic(slotData.topic || training?.name || "");
      setTrainerName(slotData.trainer_name || training?.trainer_name || "");
      setVenue(slotData.venue || training?.venue || "");

      // If slot has assigned staff, use them; otherwise default to the selected staffPool
      if (slotData.teacher_ids && slotData.teacher_ids.length > 0) {
        setSelectedTeacherIds(slotData.teacher_ids);
      } else if (slotData.assigned_staff && slotData.assigned_staff.length > 0) {
        setSelectedTeacherIds(slotData.assigned_staff.map((s) => s.id));
      } else if (staffPool && staffPool.length > 0) {
        setSelectedTeacherIds([...staffPool]);
      } else {
        setSelectedTeacherIds([]);
      }
    } else {
      setDayOfWeek("MON");
      setPeriodId("P1");
      setStartTime("09:00");
      setEndTime("10:30");
      setTopic(training?.name || "");
      setTrainerName(training?.trainer_name || "");
      setVenue(training?.venue || "");
      setSelectedTeacherIds(staffPool && staffPool.length > 0 ? [...staffPool] : []);
    }

    setTeacherSearch("");
    setDepartmentFilter("ALL");
    setError("");
  }, [isOpen, slotData, training, staffPool]);

  // Extract distinct departments for filtering
  const departments = useMemo(() => {
    const set = new Set();
    teachers.forEach((t) => {
      const dName = t.department?.name || t.department_name;
      if (dName) set.add(dName);
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers.filter((t) => {
      const dName = t.department?.name || t.department_name || "";
      if (departmentFilter !== "ALL" && dName !== departmentFilter) {
        return false;
      }
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.employee_id?.toLowerCase().includes(q) ||
        dName.toLowerCase().includes(q)
      );
    });
  }, [teachers, teacherSearch, departmentFilter]);

  const toggleTeacher = (id) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredTeachers.map((t) => t.id);
    setSelectedTeacherIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredTeachers.map((t) => t.id));
    setSelectedTeacherIds((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dayOfWeek || !periodId) {
      setError("Please select both day and period.");
      return;
    }
    if (!topic.trim()) {
      setError("Please specify a training topic or subject.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave({
        id: slotData?.id,
        day_of_week: dayOfWeek,
        period_id: periodId,
        start_time: startTime,
        end_time: endTime,
        topic: topic.trim(),
        trainer_name: trainerName.trim(),
        venue: venue.trim(),
        teacher_ids: selectedTeacherIds,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to save slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slotData?.id) return;
    setDeleting(true);
    try {
      await onDelete(slotData.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to delete slot");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 animate-scale-up space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                {isEdit ? "Configure Timetable Slot" : "Assign New Timetable Slot"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {training.name} • {dayOfWeek} • {periodId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 animate-shake">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Day & Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {daysOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label} ({d.value})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Period
              </label>
              <select
                value={periodId}
                onChange={(e) => {
                  const newPid = e.target.value;
                  setPeriodId(newPid);
                  const matchedP = periodOptions.find((p) => p.id === newPid);
                  if (matchedP?.start) setStartTime(matchedP.start);
                  if (matchedP?.end) setEndTime(matchedP.end);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {periodOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Start Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                End Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Select from Configured DB Subjects */}
          {dbSubjects && dbSubjects.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Select from Configured Training Subjects (DB)
              </label>
              <select
                onChange={(e) => {
                  const selected = dbSubjects.find((s) => s.id === e.target.value);
                  if (selected) {
                    setTopic(selected.name || "");
                    if (selected.trainer_name) setTrainerName(selected.trainer_name);
                    if (selected.venue) setVenue(selected.venue);
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>
                  -- Choose a Subject to Auto-fill --
                </option>
                {dbSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topic / Subject */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
              Topic / Training Module
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. System Architecture & High-Level Design"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Trainer & Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Trainer Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Rajesh"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Venue / Hall
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Staff Attendance Assignment Checklist */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Assign Attendance Faculty ({selectedTeacherIds.length} Selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search staff by name or ID..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Teacher Checklist Box */}
            <div className="max-h-36 overflow-y-auto border border-slate-200 bg-slate-50/50 rounded-2xl p-2 space-y-1">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-4 text-xs font-semibold text-slate-400">
                  No matching teachers found.
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacherIds.includes(t.id);
                  const inPool = staffPool.includes(t.id);
                  const dept = t.department?.name || t.department_name || "Faculty";

                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTeacher(t.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs cursor-pointer select-none transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-xs"
                          : "bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="truncate">{t.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                            isSelected
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {dept}
                        </span>
                        {inPool && (
                          <span
                            className={`text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider ${
                              isSelected
                                ? "bg-indigo-700 text-indigo-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            Roster
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Multiple faculty can mark attendance concurrently for enrolled students in this slot.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Delete Slot"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Timetable Slot"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
