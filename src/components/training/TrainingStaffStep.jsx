import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Check,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Building2,
  Plus,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { getSubjectPalette } from "../../utils/subjectColors";

export default function TrainingStaffStep({
  training,
  teachers = [],
  staffPool = [],
  setStaffPool,
  paletteTopics = [],
  setPaletteTopics,
  onProceed,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Extract all departments from teachers
  const departments = useMemo(() => {
    const set = new Set();
    teachers.forEach((t) => {
      const dName = t.department?.name || t.department_name;
      if (dName) set.add(dName);
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teachers.filter((t) => {
      const dName = t.department?.name || t.department_name || "";
      if (selectedDept !== "ALL" && dName !== selectedDept) {
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
  }, [teachers, searchQuery, selectedDept]);

  // Toggle single teacher in staff pool
  const toggleTeacher = (teacherId) => {
    setStaffPool((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // Bulk actions
  const selectAllFiltered = () => {
    const ids = filteredTeachers.map((t) => t.id);
    setStaffPool((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearFiltered = () => {
    const filteredIdSet = new Set(filteredTeachers.map((t) => t.id));
    setStaffPool((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  return (
    <div className="space-y-6 flex-1 overflow-y-auto pr-1">
      {/* Top Training Info & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-800">
              {staffPool.length} Faculty Selected
            </div>
            <div className="text-xs font-semibold text-slate-500">
              In Training Attendance Roster
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-800">
              {paletteTopics.length} Subjects Configured
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Persisted in Database
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-800 truncate">
              {training.batch_name || "All Enrolled"}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Target Cohort & Batch
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Setup: Left = Faculty Selection, Right = Palette Module Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Faculty Attendance Roster (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Step 1: Faculty Attendance Roster
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Select faculty members from any department authorized to mark attendance for this training.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
              >
                Select All ({filteredTeachers.length})
              </button>
              <button
                type="button"
                onClick={clearFiltered}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search & Department Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7 relative">
              <input
                type="text"
                placeholder="Search faculty by name, employee ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
            <div className="sm:col-span-5 relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments ({teachers.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Teacher Selection List */}
          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/40">
            {filteredTeachers.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                No faculty members match the filter criteria.
              </div>
            ) : (
              filteredTeachers.map((teacher) => {
                const isSelected = staffPool.includes(teacher.id);
                const deptName =
                  teacher.department?.name || teacher.department_name || "Faculty";

                return (
                  <div
                    key={teacher.id}
                    onClick={() => toggleTeacher(teacher.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-xs"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black truncate">{teacher.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 truncate mt-0.5">
                          <span className="truncate">{teacher.email || teacher.employee_id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 font-bold text-slate-600">
                            {deptName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isSelected ? "Assigned to Pool" : "Not In Pool"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: DB Training Subjects (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Configured Training Subjects
            </h4>
            <p className="text-xs font-semibold text-slate-500">
              Subjects configured in DB available for timetable scheduling.
            </p>
          </div>

          {/* Subjects List */}
          {paletteTopics.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-1">
              <div className="text-xs font-bold text-amber-900">
                No Subjects Configured
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                Use the <strong>Manage Subjects</strong> button on the Special Training dashboard to add subjects.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {paletteTopics.map((item) => {
                const pal = getSubjectPalette(item.topic || training?.name || "Training");

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border ${pal.light} bg-white flex items-center justify-between gap-2 shadow-2xs`}
                  >
                    <div className="truncate min-w-0">
                      <span className={`text-xs font-black ${pal.text} block truncate`}>
                        {item.topic}
                      </span>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 truncate mt-0.5">
                        {item.code && (
                          <span className="font-bold px-1 rounded bg-slate-100 text-slate-700">
                            {item.code}
                          </span>
                        )}
                        <span className="truncate">
                          Trainer: {item.trainer_name || training.trainer_name || "General Trainer"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[10px] text-indigo-900 font-semibold space-y-1">
            <div className="font-black uppercase tracking-wider flex items-center gap-1 text-indigo-700">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Drag & Drop Enabled
            </div>
            <div>
              When you drop any of these subjects onto the timetable grid in Step 2, the selected faculty roster on the left will be automatically assigned to that slot.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Proceed Bar */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500">
          Ready to schedule? Proceed to place these modules on the weekly timetable matrix.
        </div>
        <button
          type="button"
          onClick={onProceed}
          className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 hover:translate-x-0.5"
        >
          <span>Proceed to Drag & Drop Timetable</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
