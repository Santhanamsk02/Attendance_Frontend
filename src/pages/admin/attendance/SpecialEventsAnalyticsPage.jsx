import React, { useState, useEffect, useMemo } from "react";
import {
    Sparkles,
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Search,
    Filter,
    Clock,
    FileSpreadsheet,
    Award,
    Eye,
    ChevronRight,
    GraduationCap,
    BarChart3,
    Layers,
    ArrowUpRight,
    X,
} from "lucide-react";
import { specialEventService } from "../../../services/specialEventService";
import { useToast } from "../../../hooks/useToast";
import { getYearRoman } from "../../../utils/formatters";

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

export default function SpecialEventsAnalyticsPage() {
    const toast = useToast();

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Selected event for deep dive analysis
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [eventReport, setEventReport] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");

    // Fetch all events
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const data = await specialEventService.getEvents();
            setEvents(data || []);
        } catch (err) {
            console.error("Failed to fetch special events analytics", err);
            toast.error("Could not load special events analytics");
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Fetch detailed report when an event is selected
    useEffect(() => {
        if (!selectedEventId) {
            setEventReport(null);
            return;
        }

        (async () => {
            setIsLoadingReport(true);
            try {
                const report = await specialEventService.getEventReports(selectedEventId);
                setEventReport(report);
            } catch (err) {
                console.error("Failed to load event report", err);
                toast.error("Could not load detailed event analytics");
                setEventReport(null);
            } finally {
                setIsLoadingReport(false);
            }
        })();
    }, [selectedEventId]);

    // Filtered events list
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesSearch =
                !searchQuery ||
                ev.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ev.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ev.teachers.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                !categoryFilter || ev.category.toLowerCase() === categoryFilter.toLowerCase();

            const matchesStatus =
                !statusFilter || ev.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [events, searchQuery, categoryFilter, statusFilter]);

    // High level metrics
    const metrics = useMemo(() => {
        const totalEvents = events.length;
        const totalParticipations = events.reduce((sum, e) => sum + (e.student_count || 0), 0);
        const ongoingEvents = events.filter((e) => e.status.toLowerCase() === "ongoing").length;
        const completedEvents = events.filter((e) => e.status.toLowerCase() === "completed").length;
        return { totalEvents, totalParticipations, ongoingEvents, completedEvents };
    }, [events]);

    // Export report to CSV
    const exportEventReportCSV = () => {
        if (!eventReport || !eventReport.student_stats || eventReport.student_stats.length === 0) {
            toast.error("No student attendance data available for export");
            return;
        }

        const headers = ["Roll Number", "Student Name", "Department", "Section", "Days Present", "Total Days", "Attendance Rate (%)"];
        const rows = eventReport.student_stats.map((s) => [
            `"${s.roll_no}"`,
            `"${s.name}"`,
            `"${s.department || ""}"`,
            `"${s.section || ""}"`,
            s.days_present,
            s.total_days,
            `${s.percentage}%`,
        ]);

        const csvContent = [
            `Special Event Detailed Attendance Analysis: ${eventReport.event_name}`,
            `Category: ${eventReport.category}`,
            `Duration: ${eventReport.start_date} to ${eventReport.end_date}`,
            `Total Enrolled: ${eventReport.total_enrolled}, Sessions Conducted: ${eventReport.total_sessions_conducted}`,
            "",
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `${eventReport.event_name.replace(/[^a-zA-Z0-9]/g, "_")}_Analytics_Summary.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Event analytics exported successfully");
    };

    return (
        <div className="space-y-6">
            {/* ── Page Title & Context ─────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-violet-100 text-violet-700">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            Special Events Attendance Analytics
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                        Comprehensive attendance tracking, session rates, day-by-day attendance trends, and faculty accountability across trainings and workshops.
                    </p>
                </div>
            </div>

            {/* ── KPI Metrics Cards ────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Special Events
                        </span>
                        <Layers className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                        {metrics.totalEvents}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                        Across all academic departments
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Student Participations
                        </span>
                        <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                        {metrics.totalParticipations}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                        Total enrolled student spots
                    </div>
                </div>

                <div className="bg-white border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-emerald-600 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Ongoing Events
                        </span>
                        <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                        {metrics.ongoingEvents}
                    </div>
                    <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">
                        Active attendance sessions
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Completed Events
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-700">
                        {metrics.completedEvents}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                        Archived academic activities
                    </div>
                </div>
            </div>

            {/* ── Search & Filters ─────────────────────────────── */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search event name, category, or assigned teacher..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 text-slate-800 font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">All Categories</option>
                        {Object.keys(CATEGORY_COLORS).map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* ── Main Layout: Event Table & Analysis Drawer ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Event Table (Left 2 cols or full if no event selected) */}
                <div className={selectedEventId ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-violet-600" />
                                Special Academic Events ({filteredEvents.length})
                            </h3>
                            <span className="text-[11px] text-slate-400">
                                Click an event to view full attendance breakdown
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="py-3 px-4">Event & Category</th>
                                        <th className="py-3 px-4">Date Range</th>
                                        <th className="py-3 px-4 text-center">Enrolled</th>
                                        <th className="py-3 px-4">Assigned Teachers</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Analysis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-slate-400">
                                                Loading special events analytics...
                                            </td>
                                        </tr>
                                    ) : filteredEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-slate-400">
                                                No special events found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEvents.map((ev) => {
                                            const isSelected = selectedEventId === ev.id;
                                            const catColor = CATEGORY_COLORS[ev.category] || "bg-slate-50 text-slate-700 border-slate-200";

                                            return (
                                                <tr
                                                    key={ev.id}
                                                    onClick={() => setSelectedEventId(ev.id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? "bg-violet-50/70 font-semibold"
                                                            : "hover:bg-slate-50/70"
                                                    }`}
                                                >
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-slate-900 line-clamp-1">
                                                            {ev.event_name}
                                                        </div>
                                                        <span
                                                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${catColor}`}
                                                        >
                                                            {ev.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">
                                                        <div className="font-semibold text-slate-800">
                                                            {ev.start_date}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            to {ev.end_date}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="font-bold text-slate-800 text-sm">
                                                            {ev.student_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {ev.teachers.length === 0 ? (
                                                                <span className="text-slate-400 italic text-[11px]">
                                                                    Unassigned
                                                                </span>
                                                            ) : (
                                                                ev.teachers.map((t) => (
                                                                    <span
                                                                        key={t.id}
                                                                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                                    >
                                                                        {t.name}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span
                                                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                                ev.status === "Ongoing"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : ev.status === "Completed"
                                                                    ? "bg-slate-100 text-slate-700 border-slate-300"
                                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                                            }`}
                                                        >
                                                            {ev.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                                isSelected
                                                                    ? "bg-violet-600 text-white shadow-2xs"
                                                                    : "text-violet-700 bg-violet-50 hover:bg-violet-100"
                                                            }`}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            {isSelected ? "Inspecting" : "Analyze"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detailed Analysis Panel (Right col) */}
                {selectedEventId && (
                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5 sticky top-24">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                                    Deep Dive Analysis
                                </span>
                                <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                                    {eventReport?.event_name || "Loading event..."}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEventId(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {isLoadingReport ? (
                            <div className="py-16 text-center text-xs text-slate-400">
                                Aggregating attendance metrics...
                            </div>
                        ) : !eventReport ? (
                            <div className="py-16 text-center text-xs text-slate-400">
                                No attendance records logged yet for this event.
                            </div>
                        ) : (
                            <>
                                {/* Overview metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Total Enrolled
                                        </div>
                                        <div className="text-lg font-black text-slate-800 mt-0.5">
                                            {eventReport.total_enrolled}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Days Conducted
                                        </div>
                                        <div className="text-lg font-black text-violet-700 mt-0.5">
                                            {eventReport.total_sessions_conducted}
                                        </div>
                                    </div>
                                </div>

                                {/* Date-Wise Sessions Breakdown */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                        <span>Day-by-Day Sessions</span>
                                        <span className="text-[11px] text-slate-400 font-normal">
                                            {eventReport.date_summaries?.length || 0} dates
                                        </span>
                                    </div>

                                    {eventReport.date_summaries && eventReport.date_summaries.length > 0 ? (
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                            {eventReport.date_summaries.map((ds) => (
                                                <div
                                                    key={ds.date}
                                                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {ds.date}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            Present: <strong className="text-emerald-600">{ds.present_count}</strong> • Absent: <strong className="text-rose-600">{ds.absent_count}</strong>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-violet-700 text-sm">
                                                            {ds.attendance_percentage}%
                                                        </span>
                                                        <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                                            <div
                                                                className="bg-violet-600 h-1.5 rounded-full"
                                                                style={{ width: `${Math.min(ds.attendance_percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                            No daily sessions marked yet.
                                        </div>
                                    )}
                                </div>

                                {/* Student Breakdown Preview & CSV Export */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                        <span>Student Attendance Rate</span>
                                        <span className="text-[11px] text-slate-400 font-normal">
                                            {eventReport.student_stats?.length || 0} students
                                        </span>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                                        {eventReport.student_stats && eventReport.student_stats.length > 0 ? (
                                            eventReport.student_stats.slice(0, 10).map((st) => (
                                                <div
                                                    key={st.student_id}
                                                    className="p-2 flex items-center justify-between text-xs"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <div className="font-bold text-slate-800 truncate">
                                                            {st.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {st.roll_no} • {st.days_present}/{st.total_days} days
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-violet-700 text-xs shrink-0">
                                                        {st.percentage}%
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-400">
                                                No student data available.
                                            </div>
                                        )}
                                    </div>

                                    {eventReport.student_stats && eventReport.student_stats.length > 10 && (
                                        <p className="text-[11px] text-slate-400 text-center italic">
                                            Showing top 10 students. Export CSV to inspect full roster.
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={exportEventReportCSV}
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-2xs transition-all mt-2"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                        Export Full Event Analysis CSV
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
