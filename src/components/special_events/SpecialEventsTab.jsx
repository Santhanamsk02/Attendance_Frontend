import React, { useState, useEffect, useMemo } from "react";
import {
    CalendarDays,
    Plus,
    Search,
    Filter,
    Clock,
    Users,
    GraduationCap,
    CheckCircle2,
    Calendar,
    Edit3,
    Trash2,
    Eye,
    Sparkles,
    AlertCircle,
    RotateCcw,
    LayoutGrid,
    List,
    FileSpreadsheet,
} from "lucide-react";
import { specialEventService } from "../../services/specialEventService";
import SpecialEventModal from "./SpecialEventModal";
import SpecialEventReportModal from "./SpecialEventReportModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { useToast } from "../../hooks/useToast";

const CATEGORY_COLORS = {
    Training: "bg-blue-50 text-blue-700 border-blue-200",
    "Technical Workshop": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Placement Training": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Guest Lecture": "bg-amber-50 text-amber-700 border-amber-200",
    "Seminar & Conference": "bg-purple-50 text-purple-700 border-purple-200",
    Hackathon: "bg-rose-50 text-rose-700 border-rose-200",
    "College Assembly": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Department Event": "bg-teal-50 text-teal-700 border-teal-200",
    "Academic Activity": "bg-slate-50 text-slate-700 border-slate-200",
};

const STATUS_COLORS = {
    Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    Ongoing: "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse",
    Completed: "bg-slate-100 text-slate-700 border-slate-300",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function SpecialEventsTab() {
    const toast = useToast();

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filters & Display
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [reportingEvent, setReportingEvent] = useState(null);
    const [deletingEvent, setDeletingEvent] = useState(null);

    // Fetch Events
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const data = await specialEventService.getEvents();
            setEvents(data || []);
        } catch (err) {
            console.error("Failed to fetch special events", err);
            toast.error("Could not load special events list");
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Filtered Events
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesSearch =
                !searchQuery ||
                ev.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                ev.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ev.teachers.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                !categoryFilter || ev.category.toLowerCase() === categoryFilter.toLowerCase();

            const matchesStatus =
                !statusFilter || ev.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [events, searchQuery, categoryFilter, statusFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const total = events.length;
        const ongoing = events.filter((e) => e.status.toLowerCase() === "ongoing").length;
        const upcoming = events.filter((e) => e.status.toLowerCase() === "upcoming").length;
        const completed = events.filter((e) => e.status.toLowerCase() === "completed").length;
        return { total, ongoing, upcoming, completed };
    }, [events]);

    // Delete handler
    const handleDeleteEvent = async () => {
        if (!deletingEvent) return;
        try {
            await specialEventService.deleteEvent(deletingEvent.id);
            toast.success(`Event '${deletingEvent.event_name}' deleted successfully`);
            setDeletingEvent(null);
            fetchEvents();
        } catch (err) {
            console.error("Failed to delete special event", err);
            toast.error("Could not delete special event");
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Sub-Header & Action ─────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">
                            Special Academic Events & Workshops
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                        Schedule programming trainings, seminars, conferences, and college assemblies.
                        Assigned teachers can track and submit attendance directly from their mobile app.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchEvents}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                        title="Refresh Events"
                    >
                        <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingEvent(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl shadow-xs transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create Special Event
                    </button>
                </div>
            </div>

            {/* ── Metrics Summary ────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Total Events
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                        {metrics.total}
                    </div>
                </div>
                <div className="bg-white border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Ongoing Now
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                        {metrics.ongoing}
                    </div>
                </div>
                <div className="bg-white border border-blue-100 bg-blue-50/20 rounded-2xl p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                        Upcoming
                    </div>
                    <div className="text-2xl font-black text-blue-600 mt-1">
                        {metrics.upcoming}
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Completed
                    </div>
                    <div className="text-2xl font-black text-slate-700 mt-1">
                        {metrics.completed}
                    </div>
                </div>
            </div>

            {/* ── Filters Bar ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events by title, category, or faculty..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-slate-800 transition-all font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">All Categories</option>
                        <option value="Training">Training</option>
                        <option value="Technical Workshop">Workshop</option>
                        <option value="Placement Training">Placement</option>
                        <option value="Guest Lecture">Guest Lecture</option>
                        <option value="Seminar & Conference">Seminar</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="College Assembly">Assembly</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-all ${
                                viewMode === "grid"
                                    ? "bg-white text-violet-700 shadow-2xs font-bold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-lg transition-all ${
                                viewMode === "list"
                                    ? "bg-white text-violet-700 shadow-2xs font-bold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                            title="Table List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Events Grid ────────────────────────────── */}
            {isLoading ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
                    <RotateCcw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500">
                        Loading scheduled special events...
                    </p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
                    <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No Special Events Found</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {events.length === 0
                            ? "No special events or workshops have been scheduled yet. Click 'Create Special Event' to begin."
                            : "No events match your search or filter criteria. Try adjusting your search query."}
                    </p>
                </div>
            ) : viewMode === "list" ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-3 px-4">Event & Category</th>
                                    <th className="py-3 px-4">Schedule & Timing</th>
                                    <th className="py-3 px-4">Assigned Faculty</th>
                                    <th className="py-3 px-4">Students</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredEvents.map((ev) => {
                                    const catColor = CATEGORY_COLORS[ev.category] || "bg-violet-50 text-violet-700 border-violet-200";
                                    const statColor = STATUS_COLORS[ev.status] || "bg-slate-100 text-slate-700 border-slate-200";
                                    return (
                                        <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 text-sm">{ev.event_name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColor}`}>
                                                        {ev.category}
                                                    </span>
                                                    {ev.duration && (
                                                        <span className="text-[11px] text-slate-400 font-semibold">
                                                            {ev.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div className="font-semibold text-slate-800">
                                                    {ev.start_date}{ev.end_date !== ev.start_date && ` to ${ev.end_date}`}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {ev.start_time && ev.end_time ? `${ev.start_time} - ${ev.end_time}` : "Scheduled"}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {ev.teachers.length === 0 ? (
                                                    <span className="text-rose-500 text-[11px] italic">None assigned</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {ev.teachers.map((t) => (
                                                            <span key={t.id} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                                                {t.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-800 text-xs">{ev.student_count}</span>
                                                <span className="text-slate-400 text-[11px] ml-1">enrolled</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statColor}`}>
                                                    {ev.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setReportingEvent(ev)}
                                                        className="px-2.5 py-1 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all"
                                                        title="Record or View Day-Wise Attendance"
                                                    >
                                                        Day Attendance
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingEvent(ev);
                                                            setIsCreateModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Edit Event"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingEvent(ev)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Event"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((ev) => {
                        const catColor =
                            CATEGORY_COLORS[ev.category] || "bg-violet-50 text-violet-700 border-violet-200";
                        const statColor =
                            STATUS_COLORS[ev.status] || "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                            <div
                                key={ev.id}
                                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-3.5">
                                    {/* Top Badges */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${catColor}`}
                                        >
                                            {ev.category}
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statColor}`}
                                        >
                                            {ev.status}
                                        </span>
                                    </div>

                                    {/* Event Title & Description */}
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                                            {ev.event_name}
                                        </h4>
                                        {ev.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-normal">
                                                {ev.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Event Details Pill List */}
                                    <div className="space-y-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="font-semibold text-slate-700">
                                                {ev.start_date}
                                                {ev.end_date !== ev.start_date && ` to ${ev.end_date}`}
                                            </span>
                                        </div>

                                        {(ev.start_time || ev.duration) && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>
                                                    {ev.start_time && ev.end_time
                                                        ? `${ev.start_time} - ${ev.end_time}`
                                                        : "Scheduled Time"}{" "}
                                                    {ev.duration && (
                                                        <strong className="text-violet-700">
                                                            ({ev.duration})
                                                        </strong>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>
                                                <strong className="text-slate-800">
                                                    {ev.student_count}
                                                </strong>{" "}
                                                Participating Student
                                                {ev.student_count === 1 ? "" : "s"}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="text-slate-500 text-[11px] block">
                                                    Assigned Faculty:
                                                </span>
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {ev.teachers.length === 0 ? (
                                                        <span className="text-[11px] text-rose-500 italic">
                                                            No faculty assigned
                                                        </span>
                                                    ) : (
                                                        ev.teachers.map((t) => (
                                                            <span
                                                                key={t.id}
                                                                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                            >
                                                                {t.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Actions */}
                                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReportingEvent(ev)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Day-Wise Attendance
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingEvent(ev);
                                                setIsCreateModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Edit Event"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingEvent(ev)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Event"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modals ─────────────────────────────────── */}
            <SpecialEventModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingEvent(null);
                }}
                event={editingEvent}
                onSuccess={fetchEvents}
            />

            <SpecialEventReportModal
                isOpen={!!reportingEvent}
                onClose={() => setReportingEvent(null)}
                event={reportingEvent}
            />

            <ConfirmDialog
                isOpen={!!deletingEvent}
                onClose={() => setDeletingEvent(null)}
                onConfirm={handleDeleteEvent}
                title="Delete Special Event?"
                message={`Are you sure you want to permanently delete '${deletingEvent?.event_name}'? All student enrollments and attendance records associated with this event will be deleted.`}
                confirmText="Delete Event"
                confirmVariant="danger"
            />
        </div>
    );
}
