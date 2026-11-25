import React, { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    Download,
    Search,
    Clock,
    UserCheck,
    FileSpreadsheet,
    AlertCircle,
    Save,
    CheckSquare,
    Square,
} from "lucide-react";
import Modal from "../common/Modal";
import { specialEventService } from "../../services/specialEventService";
import { useToast } from "../../hooks/useToast";
import { getStudentYear, getYearRoman } from "../../utils/formatters";

export default function SpecialEventReportModal({ isOpen, onClose, event }) {
    const toast = useToast();

    const [selectedDate, setSelectedDate] = useState("");
    const [reportData, setReportData] = useState(null);
    const [editableRecords, setEditableRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PRESENT | ABSENT
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (!isOpen || !event) return;
        const initialDate = event.start_date || new Date().toISOString().split("T")[0];
        setSelectedDate(initialDate);
        setHasUnsavedChanges(false);
    }, [isOpen, event]);

    const fetchAttendance = async () => {
        if (!isOpen || !event || !selectedDate) return;
        setIsLoading(true);
        try {
            const data = await specialEventService.getEventAttendance(event.id, selectedDate);
            setReportData(data);
            setEditableRecords((data?.records || []).map((r) => ({ ...r })));
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error("Failed to load attendance report", err);
            toast.error("Could not fetch attendance records for this date");
            setReportData(null);
            setEditableRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [isOpen, event, selectedDate]);

    // Live counts based on editable records
    const stats = useMemo(() => {
        const total = editableRecords.length;
        const present = editableRecords.filter((r) => r.status.toUpperCase() === "PRESENT").length;
        const absent = total - present;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, absent, pct };
    }, [editableRecords]);

    // Filter students
    const filteredRecords = useMemo(() => {
        return editableRecords.filter((r) => {
            const matchesSearch =
                !searchQuery ||
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.roll_no.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [editableRecords, searchQuery, statusFilter]);

    // Toggle individual student status
    const toggleStudentStatus = (studentId) => {
        setEditableRecords((prev) =>
            prev.map((r) => {
                if (r.student_id === studentId) {
                    const nextStatus = r.status.toUpperCase() === "PRESENT" ? "ABSENT" : "PRESENT";
                    return { ...r, status: nextStatus };
                }
                return r;
            })
        );
        setHasUnsavedChanges(true);
    };

    // Mark all filtered or all students
    const markAllStudents = (newStatus) => {
        setEditableRecords((prev) =>
            prev.map((r) => ({ ...r, status: newStatus }))
        );
        setHasUnsavedChanges(true);
    };

    // Save attendance to backend
    const handleSaveAttendance = async () => {
        if (!event || !selectedDate) return;
        setIsSaving(true);
        try {
            const payload = {
                attendance_date: selectedDate,
                marks: editableRecords.map((r) => ({
                    student_id: r.student_id,
                    status: r.status.toUpperCase(),
                    remarks: r.remarks || null,
                })),
            };

            await specialEventService.submitEventAttendance(event.id, payload);
            toast.success(`Attendance saved for ${selectedDate}`);
            setHasUnsavedChanges(false);
            await fetchAttendance();
        } catch (err) {
            console.error("Failed to save special event attendance", err);
            toast.error(err?.response?.data?.detail || "Could not save attendance");
        } finally {
            setIsSaving(false);
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (editableRecords.length === 0) {
            toast.error("No records available to export");
            return;
        }

        const headers = ["Roll Number", "Student Name", "Department", "Year", "Section", "Attendance Status", "Remarks"];
        const rows = editableRecords.map((r) => [
            `"${r.roll_no}"`,
            `"${r.name}"`,
            `"${r.department || ""}"`,
            `"Year ${getStudentYear(r)}"`,
            `"${r.section || ""}"`,
            `"${r.status}"`,
            `"${r.remarks || ""}"`,
        ]);

        const csvContent = [
            `Special Event Day-Wise Attendance: ${event.event_name}`,
            `Category: ${event.category}`,
            `Date: ${selectedDate}`,
            `Marked By: ${reportData?.marked_by_teacher || "Administrator / Assigned Faculty"}`,
            `Total: ${stats.total}, Present: ${stats.present}, Absent: ${stats.absent}, Rate: ${stats.pct}%`,
            "",
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `${event.event_name.replace(/[^a-zA-Z0-9]/g, "_")}_Attendance_${selectedDate}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Attendance report downloaded successfully");
    };

    if (!event) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${event.event_name} — Day-Wise Attendance`}
            subtitle={`Category: ${event.category} • Scheduled Duration: ${event.duration || "N/A"}`}
            maxWidth="max-w-4xl"
        >
            <div className="p-6 space-y-6">
                {/* ── Controls Bar: Date Selector & Export ──── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                            <Calendar className="w-4 h-4 text-violet-600" />
                            Select Session Date:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            min={event.start_date}
                            max={event.end_date}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <span className="text-[11px] text-slate-400 font-medium">
                            (Event span: {event.start_date} to {event.end_date})
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-all"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* ── Stats Overview ────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Enrolled Students
                        </div>
                        <div className="text-2xl font-black text-slate-800 mt-1">
                            {stats.total}
                        </div>
                    </div>
                    <div className="bg-white border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 shadow-2xs">
                        <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Present
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                            {stats.present}
                        </div>
                    </div>
                    <div className="bg-white border border-rose-100 bg-rose-50/20 rounded-2xl p-4 shadow-2xs">
                        <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Absent
                        </div>
                        <div className="text-2xl font-black text-rose-600 mt-1">
                            {stats.absent}
                        </div>
                    </div>
                    <div className="bg-white border border-violet-100 bg-violet-50/20 rounded-2xl p-4 shadow-2xs">
                        <div className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                            Attendance Rate
                        </div>
                        <div className="text-2xl font-black text-violet-700 mt-1">
                            {stats.pct}%
                        </div>
                    </div>
                </div>

                {reportData?.marked_by_teacher && (
                    <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                            Recorded / updated by:{" "}
                            <strong className="text-slate-700">
                                {reportData.marked_by_teacher}
                            </strong>
                        </span>
                    </div>
                )}

                {/* ── Table Filter Bar & Bulk Actions ───────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by student name or roll no..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                            {["ALL", "PRESENT", "ABSENT"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        statusFilter === st
                                            ? "bg-white text-slate-800 shadow-2xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                            <button
                                type="button"
                                onClick={() => markAllStudents("PRESENT")}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                            >
                                All Present
                            </button>
                            <button
                                type="button"
                                onClick={() => markAllStudents("ABSENT")}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"
                            >
                                All Absent
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Students Table ────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="max-h-[380px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3 px-4">Roll No</th>
                                    <th className="py-3 px-4">Student Name</th>
                                    <th className="py-3 px-4">Dept / Section</th>
                                    <th className="py-3 px-4 text-center">Action / Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-400">
                                            Loading attendance data...
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-400">
                                            No students found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((r) => {
                                        const isPresent = r.status.toUpperCase() === "PRESENT";
                                        return (
                                            <tr
                                                key={r.student_id}
                                                onClick={() => toggleStudentStatus(r.student_id)}
                                                className="hover:bg-violet-50/40 cursor-pointer transition-colors"
                                                title="Click to toggle Present/Absent"
                                            >
                                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                    {r.roll_no}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-800">
                                                    {r.name}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">
                                                    {r.department || "General"} • Year {getStudentYear(r)} • Sec {r.section || "—"}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] transition-all select-none ${
                                                            isPresent
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                                        }`}
                                                    >
                                                        {isPresent ? (
                                                            <>
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                Present
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                                Absent
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Modal Footer ──────────────────────────── */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                        {hasUnsavedChanges && (
                            <span className="text-xs text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                You have unsaved attendance marks! Click "Save Day Attendance" to submit.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAttendance}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Day Attendance"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
