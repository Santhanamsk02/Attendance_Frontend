import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Trash2,
  Edit,
  Clock,
  UserCheck,
  AlertTriangle,
  Layers,
  PlusCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Building,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import { apiClient } from "../../services/api";
import { calendarService } from "../../services/calendarService";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../hooks/useToast";

const TYPE_CONFIG = {
  HOLIDAY: { label: "Holiday", bg: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500", icon: AlertTriangle },
  HALF_DAY: { label: "Half Day", bg: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500", icon: CalendarIcon },
  SUBSTITUTE_STAFF: { label: "Substitute Staff", bg: "bg-sky-50 border-sky-200 text-sky-700", dot: "bg-sky-500", icon: UserCheck },
  CHANGE_PERIOD: { label: "Change Period", bg: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500", icon: Layers },
  ADD_PERIOD: { label: "Add Period", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", icon: PlusCircle },
  CHANGE_TIMINGS: { label: "Bell Timings", bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", icon: Clock },
  EXAM_DAY: { label: "Exam / Event", bg: "bg-cyan-50 border-cyan-200 text-cyan-700", dot: "bg-cyan-500", icon: Sparkles },
  DAY_SWAP: { label: "Day Swap", bg: "bg-teal-50 border-teal-200 text-teal-700", dot: "bg-teal-500", icon: ArrowRight },
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // month | list
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/institution/departments");
        setDepartments(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch departments", e);
      }
    })();
  }, []);

  // Helper to get formatted scope label
  const getScopeLabel = (ov) => {
    if (!ov.department_id) return "All Institution";
    const dept = departments.find((d) => d.id === ov.department_id);
    const deptCode = dept ? (dept.code || dept.name) : ov.department_id;

    if (!ov.section_name) return `${deptCode} Dept`;

    const yearRoman = ov.semester
      ? ["I", "II", "III", "IV", "V"][Math.ceil(ov.semester / 2) - 1] || ""
      : "";

    return `${deptCode} ${yearRoman ? yearRoman + "-" : ""}${ov.section_name}`;
  };

  // Confirm delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load overrides
  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const items = await calendarService.getOverrides();
      setOverrides(items || []);
    } catch (e) {
      toast.error("Failed to load calendar overrides.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (dateStr) => {
    navigate(`/calendar/configure?startDate=${dateStr}&endDate=${dateStr}`);
  };

  const handleCreateNew = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    navigate(`/calendar/configure?startDate=${todayStr}&endDate=${todayStr}`);
  };

  const handleEdit = (item) => {
    navigate(`/calendar/configure?id=${item.id}`);
  };


  const handleSaveOverride = async (payload) => {
    try {
      if (editingItem) {
        await calendarService.updateOverride(editingItem.id, payload);
        toast.success("Calendar override updated successfully.");
      } else {
        await calendarService.createOverride(payload);
        toast.success("Calendar override created successfully.");
      }
      setModalOpen(false);
      fetchOverrides();
    } catch (e) {
      toast.error("Failed to save calendar override.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await calendarService.deleteOverride(deleteConfirm.id);
      toast.success("Calendar override deleted.");
      setDeleteConfirm(null);
      fetchOverrides();
    } catch (e) {
      toast.error("Failed to delete override.");
    }
  };

  // Helper to check if override covers a given YYYY-MM-DD
  const getOverridesForDate = (dateStr) => {
    return overrides.filter((o) => {
      if (selectedDept && o.department_id && o.department_id !== selectedDept) return false;
      if (selectedType && o.override_type !== selectedType) return false;
      return dateStr >= o.start_date && dateStr <= o.end_date;
    });
  };

  // Filtered list for list view
  const filteredOverrides = overrides.filter((o) => {
    if (selectedDept && o.department_id && o.department_id !== selectedDept) return false;
    if (selectedType && o.override_type !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return o.title.toLowerCase().includes(q) || o.override_type.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            Academic Calendar & Overrides
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage single-day and multi-day timetable overrides, substitute staff, bell timings, and holidays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverrides}
            className="p-2.5 rounded-2xl neu-btn text-slate-600 hover:text-slate-800"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex bg-slate-200/50 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              List View
            </button>
          </div>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold neu-btn-primary rounded-2xl shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Override
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl neu-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Override Type Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">All Override Types</option>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        {viewMode === "list" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search overrides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* ── MONTH CALENDAR VIEW ────────────────────────────── */}
      {viewMode === "month" && (
        <div className="rounded-3xl neu-card overflow-hidden">

          {/* Calendar Header Navigation */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-100/40 text-center py-2.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <span key={day} className={`text-[11px] font-black uppercase tracking-wider ${idx >= 5 ? "text-rose-400" : "text-slate-400"}`}>
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/30">
            {/* Blank leading cells */}
            {Array.from({ length: startingDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-[110px] p-2 bg-slate-50/50" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = new Date().toISOString().split("T")[0] === dateStr;
              const dayOverrides = getOverridesForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  className={`min-h-[110px] p-2 transition-colors cursor-pointer group hover:bg-indigo-50/30 relative flex flex-col justify-between ${
                    isToday ? "bg-indigo-50/40 font-bold" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-extrabold flex items-center justify-center h-6 w-6 rounded-full ${
                      isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700"
                    }`}>
                      {dayNum}
                    </span>
                    {dayOverrides.length > 0 && (
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        {dayOverrides.length}
                      </span>
                    )}
                  </div>

                  {/* Override Badges */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5 scrollbar-thin">
                    {dayOverrides.map((ov) => {
                      const cfg = TYPE_CONFIG[ov.override_type] || TYPE_CONFIG.CHANGE_PERIOD;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={ov.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(ov);
                          }}
                          className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-start gap-1 transition-transform hover:scale-[1.02] ${cfg.bg}`}
                          title={`${ov.title} (${ov.start_date} to ${ov.end_date})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                          <span className="truncate leading-tight">{ov.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="rounded-3xl neu-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
              All Configured Overrides ({filteredOverrides.length})
            </h3>
          </div>

          {filteredOverrides.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-500">No calendar overrides found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Override" above to configure a timetable exception.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOverrides.map((ov) => {
                const cfg = TYPE_CONFIG[ov.override_type] || TYPE_CONFIG.CHANGE_PERIOD;
                const Icon = cfg.icon;
                return (
                  <div
                    key={ov.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl border ${cfg.bg} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800">{ov.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-semibold">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {ov.start_date === ov.end_date ? ov.start_date : `${ov.start_date} → ${ov.end_date}`}
                          </span>
                          <span>•</span>
                          <span>Scope: {getScopeLabel(ov)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEdit(ov)}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ov)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Calendar Override?"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? Regular weekly timetable rules will apply for these dates.`}
        confirmText="Delete Override"
        variant="danger"
      />


    </div>
  );
}
