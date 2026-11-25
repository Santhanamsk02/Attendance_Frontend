import React, { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    Clock,
    Users,
    GraduationCap,
    CheckSquare,
    Square,
    Search,
    AlertCircle,
    Sparkles,
    BookOpen,
    Filter,
    Check,
    X,
    Loader2,
    CheckCheck,
} from "lucide-react";
import Modal from "../common/Modal";
import Pagination from "../common/Pagination";
import { specialEventService } from "../../services/specialEventService";
import { studentService } from "../../services/studentService";
import { teacherService } from "../../services/teacherService";
import { useToast } from "../../hooks/useToast";
import { useDebounce } from "../../hooks/useDebounce";
import { getStudentYear, getYearRoman } from "../../utils/formatters";

const CATEGORIES = [
    "Training",
    "Technical Workshop",
    "Placement Training",
    "Guest Lecture",
    "Seminar & Conference",
    "Hackathon",
    "College Assembly",
    "Department Event",
    "Academic Activity",
];

export default function SpecialEventModal({ isOpen, onClose, event, onSuccess }) {
    const toast = useToast();
    const isEdit = !!event;

    const [activeTab, setActiveTab] = useState("details"); // 'details' | 'teachers' | 'students'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [eventName, setEventName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Training");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("16:00");
    const [status, setStatus] = useState("Upcoming");

    // Teachers
    const [allTeachers, setAllTeachers] = useState([]);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

    // Students
    const [allStudents, setAllStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isSelectingAllMatching, setIsSelectingAllMatching] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");
    const debouncedSearch = useDebounce(studentSearch, 300);

    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [selectedStudentsMap, setSelectedStudentsMap] = useState({});
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Pagination for student list
    const [studentPage, setStudentPage] = useState(1);
    const [studentPageSize, setStudentPageSize] = useState(25);
    const [studentTotal, setStudentTotal] = useState(0);
    const [studentTotalPages, setStudentTotalPages] = useState(1);

    // Pagination for selected only view
    const [selectedPage, setSelectedPage] = useState(1);

    // Student Filters
    const [filterDept, setFilterDept] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterSec, setFilterSec] = useState("");

    // Metadata
    const [departments, setDepartments] = useState([]);
    const [availableSections, setAvailableSections] = useState(["A", "B", "C", "D", "E", "F", "G"]);

    // Reset pagination to page 1 on filter/search change
    useEffect(() => {
        setStudentPage(1);
    }, [filterDept, filterYear, filterSec, debouncedSearch, studentPageSize]);

    useEffect(() => {
        setSelectedPage(1);
    }, [studentSearch, showOnlySelected]);

    // Prepopulate when opening edit or new
    useEffect(() => {
        if (!isOpen) return;

        if (event) {
            setEventName(event.event_name || "");
            setDescription(event.description || "");
            setCategory(event.category || "Training");
            setStartDate(event.start_date || new Date().toISOString().split("T")[0]);
            setEndDate(event.end_date || new Date().toISOString().split("T")[0]);
            setStartTime(event.start_time || "09:00");
            setEndTime(event.end_time || "16:00");
            setStatus(event.status || "Upcoming");
            setSelectedTeacherIds((event.teachers || []).map((t) => t.id));

            // Fetch enrolled students for this event if editing
            (async () => {
                try {
                    const enrolled = await specialEventService.getEventStudents(event.id);
                    const idSet = new Set();
                    const map = {};
                    enrolled.forEach((s) => {
                        idSet.add(s.id);
                        map[s.id] = s;
                    });
                    setSelectedStudentIds(idSet);
                    setSelectedStudentsMap(map);
                } catch {
                    setSelectedStudentIds(new Set());
                    setSelectedStudentsMap({});
                }
            })();
        } else {
            // New event defaults
            setEventName("");
            setDescription("");
            setCategory("Training");
            const today = new Date().toISOString().split("T")[0];
            setStartDate(today);
            setEndDate(today);
            setStartTime("09:00");
            setEndTime("16:00");
            setStatus("Upcoming");
            setSelectedTeacherIds([]);
            setSelectedStudentIds(new Set());
            setSelectedStudentsMap({});
            setStudentPage(1);
            setShowOnlySelected(false);
        }
        setActiveTab("details");
    }, [isOpen, event]);

    // Load filter options & teachers
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                const meta = await specialEventService.getFilterOptions();
                setDepartments(meta.departments || []);
                setAllTeachers(meta.teachers || []);
                if (meta.semesters && meta.semesters.length > 0) {
                    setAvailableSemesters(meta.semesters);
                }
                if (meta.sections && meta.sections.length > 0) {
                    setAvailableSections(meta.sections);
                }
            } catch (err) {
                console.error("Failed to load special event options", err);
            }
        })();
    }, [isOpen]);

    // Load students dynamically with server-side pagination and filters
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        (async () => {
            setIsLoadingStudents(true);
            try {
                const params = {
                    page: studentPage,
                    limit: studentPageSize,
                };
                if (debouncedSearch && debouncedSearch.trim()) {
                    params.search = debouncedSearch.trim();
                }
                if (filterDept) params.department_id = filterDept;
                if (filterYear) params.year = parseInt(filterYear, 10);
                if (filterSec) params.section = filterSec;

                const res = await studentService.getStudents(params);
                if (!isMounted) return;

                const items = res.items || res || [];
                setAllStudents(items);
                setStudentTotal(res.total ?? items.length);
                setStudentTotalPages(res.total_pages ?? Math.max(1, Math.ceil((res.total || items.length) / studentPageSize)));

                // Sync selectedStudentsMap with any students from this page that are already in selectedStudentIds
                setSelectedStudentsMap((prev) => {
                    const next = { ...prev };
                    items.forEach((s) => {
                        if (selectedStudentIds.has(s.id) && !next[s.id]) {
                            next[s.id] = s;
                        }
                    });
                    return next;
                });
            } catch (err) {
                console.error("Failed to fetch students", err);
                toast.error("Failed to load students list");
                if (isMounted) {
                    setAllStudents([]);
                    setStudentTotal(0);
                    setStudentTotalPages(1);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingStudents(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [isOpen, filterDept, filterYear, filterSec, debouncedSearch, studentPage, studentPageSize]);

    // Duration calculation
    const calculatedDuration = useMemo(() => {
        if (!startDate || !endDate) return "";
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

        if (startTime && endTime) {
            const [h1, m1] = startTime.split(":").map(Number);
            const [h2, m2] = endTime.split(":").map(Number);
            let mins = h2 * 60 + m2 - (h1 * 60 + m1);
            if (mins < 0) mins += 24 * 60;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const daily = m > 0 ? `${h}h ${m}m/day` : `${h}h/day`;
            return diffDays > 1 ? `${daily} (${diffDays} days)` : `${h}h ${m ? `${m}m` : ""}`;
        }
        return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }, [startDate, endDate, startTime, endTime]);

    // Filtered teachers
    const filteredTeachers = useMemo(() => {
        if (!teacherSearch) return allTeachers;
        const q = teacherSearch.toLowerCase();
        return allTeachers.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.employee_id.toLowerCase().includes(q) ||
                (t.department && t.department.toLowerCase().includes(q))
        );
    }, [allTeachers, teacherSearch]);

    // Toggle teacher selection
    const toggleTeacher = (teacherId) => {
        setSelectedTeacherIds((prev) => {
            if (prev.includes(teacherId)) {
                return prev.filter((id) => id !== teacherId);
            } else {
                return [...prev, teacherId];
            }
        });
    };

    // Toggle student selection
    const toggleStudent = (student) => {
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            if (next.has(student.id)) {
                next.delete(student.id);
            } else {
                next.add(student.id);
            }
            return next;
        });

        setSelectedStudentsMap((prev) => {
            const next = { ...prev };
            if (next[student.id]) {
                delete next[student.id];
            } else {
                next[student.id] = student;
            }
            return next;
        });
    };

    // Toggle all students on the current page
    const isAllPageSelected =
        allStudents.length > 0 &&
        allStudents.every((s) => selectedStudentIds.has(s.id));

    const handleSelectPage = () => {
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            if (isAllPageSelected) {
                allStudents.forEach((s) => next.delete(s.id));
            } else {
                allStudents.forEach((s) => next.add(s.id));
            }
            return next;
        });

        setSelectedStudentsMap((prev) => {
            const next = { ...prev };
            if (isAllPageSelected) {
                allStudents.forEach((s) => delete next[s.id]);
            } else {
                allStudents.forEach((s) => (next[s.id] = s));
            }
            return next;
        });
    };

    // Select ALL matching students across all pages for the current filter/search
    const handleSelectAllFilteredStudents = async () => {
        if (studentTotal === 0 || isSelectingAllMatching) return;
        setIsSelectingAllMatching(true);
        try {
            const params = {
                page: 1,
                limit: Math.min(2000, studentTotal),
            };
            if (debouncedSearch && debouncedSearch.trim()) {
                params.search = debouncedSearch.trim();
            }
            if (filterDept) params.department_id = filterDept;
            if (filterYear) params.year = parseInt(filterYear, 10);
            if (filterSec) params.section = filterSec;

            const res = await studentService.getStudents(params);
            const items = res.items || res || [];

            setSelectedStudentIds((prev) => {
                const next = new Set(prev);
                items.forEach((s) => next.add(s.id));
                return next;
            });

            setSelectedStudentsMap((prev) => {
                const next = { ...prev };
                items.forEach((s) => (next[s.id] = s));
                return next;
            });

            toast.success(`Successfully enrolled all ${items.length} matching students.`);
        } catch (err) {
            console.error("Failed to select all matching students", err);
            toast.error("Failed to enroll all students across pages");
        } finally {
            setIsSelectingAllMatching(false);
        }
    };

    // Clear all student selections
    const handleClearSelection = () => {
        setSelectedStudentIds(new Set());
        setSelectedStudentsMap({});
        toast.info("Cleared all student selections");
    };

    // Students to display in the list (either paginated selected or current server page)
    const displayedStudents = useMemo(() => {
        if (showOnlySelected) {
            let list = Object.values(selectedStudentsMap);
            if (studentSearch && studentSearch.trim()) {
                const q = studentSearch.toLowerCase().trim();
                list = list.filter(
                    (s) =>
                        (s.name && s.name.toLowerCase().includes(q)) ||
                        (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
                        (s.section && s.section.toLowerCase().includes(q))
                );
            }
            const start = (selectedPage - 1) * studentPageSize;
            return list.slice(start, start + studentPageSize);
        }
        return allStudents;
    }, [showOnlySelected, selectedStudentsMap, studentSearch, selectedPage, studentPageSize, allStudents]);

    const totalSelectedDisplayCount = useMemo(() => {
        if (!studentSearch || !studentSearch.trim()) {
            return selectedStudentIds.size;
        }
        const q = studentSearch.toLowerCase().trim();
        return Object.values(selectedStudentsMap).filter(
            (s) =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
                (s.section && s.section.toLowerCase().includes(q))
        ).length;
    }, [selectedStudentsMap, studentSearch, selectedStudentIds]);

    const selectedTotalPages = Math.max(
        1,
        Math.ceil(totalSelectedDisplayCount / studentPageSize)
    );

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!eventName.trim()) {
            toast.error("Please enter an event name");
            setActiveTab("details");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date cannot be earlier than start date");
            setActiveTab("details");
            return;
        }

        if (selectedTeacherIds.length === 0) {
            toast.error("Please assign at least one teacher to record attendance");
            setActiveTab("teachers");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                event_name: eventName.trim(),
                description: description.trim() || null,
                category,
                start_date: startDate,
                end_date: endDate,
                start_time: startTime,
                end_time: endTime,
                duration: calculatedDuration,
                status,
                teacher_ids: selectedTeacherIds,
                student_ids: Array.from(selectedStudentIds),
            };

            if (isEdit) {
                await specialEventService.updateEvent(event.id, payload);
                toast.success("Special event updated successfully");
            } else {
                await specialEventService.createEvent(payload);
                toast.success("Special event created and scheduled successfully");
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save special event", err);
            const errMsg = err.response?.data?.detail || "Failed to save special event";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Special Event" : "Create New Special Event"}
            subtitle="Configure academic activities, assign responsible teachers, and enroll students."
            maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
                {/* ── Navigation Tabs ─────────────────────────── */}
                <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab("details")}
                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === "details"
                                ? "border-violet-600 text-violet-700 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        1. Event Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("teachers")}
                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === "teachers"
                                ? "border-violet-600 text-violet-700 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        2. Assign Teachers
                        {selectedTeacherIds.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                                {selectedTeacherIds.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("students")}
                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === "students"
                                ? "border-violet-600 text-violet-700 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        3. Enrolled Students
                        {selectedStudentIds.size > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                {selectedStudentIds.size}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Tab Content ────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* TAB 1: DETAILS */}
                    {activeTab === "details" && (
                        <div className="space-y-5 animate-fade-in">
                            {/* Event Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Event Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Python Full-Stack Workshop / Placement Drive / Hackathon"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800 font-medium"
                                    required
                                />
                            </div>

                            {/* Category & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                    >
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Start Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        End Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Daily Time & Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Start Time (Daily)
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        End Time (Daily)
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Calculated Duration
                                    </label>
                                    <div className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-violet-600" />
                                        {calculatedDuration || "—"}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Description & Guidelines
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Provide brief details about the venue, speaker, prerequisites, or session structure..."
                                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all text-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB 2: TEACHERS */}
                    {activeTab === "teachers" && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-violet-900 leading-relaxed">
                                    <span className="font-bold">Important Authorization Rule:</span> Only assigned
                                    teachers will be able to access this special event on their mobile app and record
                                    daily attendance.
                                </div>
                            </div>

                            {/* Teacher Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    placeholder="Search faculty by name, employee ID, or department..."
                                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-slate-800"
                                />
                            </div>

                            {/* Teacher Selection List */}
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[360px] overflow-y-auto bg-white">
                                {filteredTeachers.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        No faculty members found matching your search.
                                    </div>
                                ) : (
                                    filteredTeachers.map((t) => {
                                        const isSelected = selectedTeacherIds.includes(t.id);
                                        return (
                                            <div
                                                key={t.id}
                                                onClick={() => toggleTeacher(t.id)}
                                                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                    isSelected ? "bg-violet-50/60" : "hover:bg-slate-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                                            isSelected
                                                                ? "bg-violet-600 border-violet-600 text-white"
                                                                : "border-slate-300 bg-white"
                                                        }`}
                                                    >
                                                        {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">
                                                            {t.name}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500">
                                                            {t.employee_id} • {t.department || "General"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                                                        Assigned
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: STUDENTS */}
                    {activeTab === "students" && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Filter Bar */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                        <Filter className="w-3.5 h-3.5 text-violet-600" />
                                        Cohort / Section Filter
                                    </div>
                                    <span className="text-xs font-bold text-violet-700">
                                        {selectedStudentIds.size} student
                                        {selectedStudentIds.size === 1 ? "" : "s"} selected
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <select
                                        value={filterDept}
                                        onChange={(e) => setFilterDept(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name} ({d.code})
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                                    >
                                        <option value="">All Years</option>
                                        <option value="1">Year I</option>
                                        <option value="2">Year II</option>
                                        <option value="3">Year III</option>
                                        <option value="4">Year IV</option>
                                    </select>
                                    <select
                                        value={filterSec}
                                        onChange={(e) => setFilterSec(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                                    >
                                        <option value="">All Sections</option>
                                        {availableSections.map((sec) => (
                                            <option key={sec} value={sec}>
                                                Section {sec}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Search & Bulk Selection Actions */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        placeholder="Search by student name or roll number..."
                                        className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-slate-800 font-medium"
                                    />
                                    {studentSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setStudentSearch("")}
                                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 border ${
                                        showOnlySelected
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    Selected Only ({selectedStudentIds.size})
                                </button>
                                {!showOnlySelected && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSelectPage}
                                            disabled={allStudents.length === 0}
                                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                                        >
                                            {isAllPageSelected ? (
                                                <>
                                                    <CheckSquare className="w-3.5 h-3.5 text-violet-600" />
                                                    Deselect Page ({allStudents.length})
                                                </>
                                            ) : (
                                                <>
                                                    <Square className="w-3.5 h-3.5 text-slate-400" />
                                                    Select Page ({allStudents.length})
                                                </>
                                            )}
                                        </button>
                                        {studentTotal > allStudents.length && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAllFilteredStudents}
                                                disabled={isSelectingAllMatching}
                                                className="px-3 py-2 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 shadow-2xs"
                                            >
                                                {isSelectingAllMatching ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Enrolling all...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCheck className="w-3.5 h-3.5 text-violet-600" />
                                                        Enroll All {studentTotal} Filtered
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                                {selectedStudentIds.size > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        className="px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1 shrink-0"
                                        title="Clear all student selections"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Student List */}
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[300px] overflow-y-auto bg-white">
                                {isLoadingStudents ? (
                                    <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                                        Loading students list...
                                    </div>
                                ) : displayedStudents.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        {showOnlySelected
                                            ? "No selected students found."
                                            : "No students found matching your criteria."}
                                    </div>
                                ) : (
                                    displayedStudents.map((s) => {
                                        const isSelected = selectedStudentIds.has(s.id);
                                        const deptName =
                                            s.department?.name ||
                                            s.department?.code ||
                                            departments.find((d) => d.id === s.department_id)?.name ||
                                            s.department_id ||
                                            "";
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => toggleStudent(s)}
                                                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                                            isSelected
                                                                ? "bg-emerald-600 border-emerald-600 text-white"
                                                                : "border-slate-300 bg-white"
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">
                                                            {s.name}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500">
                                                            {s.roll_no} • Year {getStudentYear(s)} • Sec {s.section || "—"}
                                                            {deptName ? ` • ${deptName}` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Enrolled
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {showOnlySelected ? (
                                <Pagination
                                    currentPage={selectedPage}
                                    totalPages={selectedTotalPages}
                                    totalItems={totalSelectedDisplayCount}
                                    limit={studentPageSize}
                                    onPageChange={(p) => setSelectedPage(p)}
                                    itemName="selected students"
                                />
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span>Show</span>
                                        <select
                                            value={studentPageSize}
                                            onChange={(e) => setStudentPageSize(Number(e.target.value))}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-violet-500"
                                        >
                                            <option value={20}>20</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span>per page</span>
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                        <Pagination
                                            currentPage={studentPage}
                                            totalPages={studentTotalPages}
                                            totalItems={studentTotal}
                                            limit={studentPageSize}
                                            onPageChange={(p) => setStudentPage(p)}
                                            isLoading={isLoadingStudents}
                                            itemName="students"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Modal Footer ───────────────────────────── */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {activeTab !== "details" && (
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveTab(activeTab === "students" ? "teachers" : "details")
                                }
                                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Back
                            </button>
                        )}
                        {activeTab !== "students" && (
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveTab(activeTab === "details" ? "teachers" : "students")
                                }
                                className="px-3.5 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all"
                            >
                                Next Step →
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
                        >
                            {isSubmitting
                                ? "Saving..."
                                : isEdit
                                ? "Update Special Event"
                                : "Schedule Special Event"}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
