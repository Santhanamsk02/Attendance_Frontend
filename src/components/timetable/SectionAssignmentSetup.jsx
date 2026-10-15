import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Users2, ChevronRight, Save, Loader, CheckCircle, AlertCircle,
    Search, Edit2, X, User
} from "lucide-react";
import { apiClient } from "../../services/api";

/**
 * Step 1 of Timetable config: assign a teacher to every subject for this section.
 * Features: staff search, inline edit mode per row, bulk save.
 */
export default function SectionAssignmentSetup({ context, onProceed, onBack }) {
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState({});   // { subject_id: teacher_id | "" }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    // Search & edit
    const [subjectSearch, setSubjectSearch] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [editingRow, setEditingRow] = useState(null);  // subject_id being edited
    const [staffDropdownSearch, setStaffDropdownSearch] = useState(""); // per-row staff filter

    // ── Data loading ─────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [subjectsRes, teachersRes] = await Promise.all([
                apiClient.get("/section-assignments/", {
                    params: {
                        department: context.department,
                        academic_year: context.academic_year,
                        semester: context.semester,
                        section_name: context.section,
                    },
                }),
                apiClient.get("/section-assignments/teachers", {
                    params: { department: context.department },
                }),
            ]);
            setSubjects(subjectsRes.data);
            setTeachers(teachersRes.data);

            const existing = {};
            for (const row of subjectsRes.data) {
                existing[row.subject.id] = row.teacher?.id || "";
            }
            setAssignments(existing);
        } catch {
            setError("Failed to load assignment data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [context]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Derived values ───────────────────────────────────────────────────────

    const assignedCount = Object.values(assignments).filter(Boolean).length;
    const totalCount = subjects.length;
    const allAssigned = assignedCount === totalCount && totalCount > 0;

    const filteredSubjects = useMemo(() => {
        const q = subjectSearch.trim().toLowerCase();
        if (!q) return subjects;
        return subjects.filter(({ subject }) =>
            subject.subject_name.toLowerCase().includes(q) ||
            subject.subject_code.toLowerCase().includes(q) ||
            (subject.subject_title || "").toLowerCase().includes(q)
        );
    }, [subjects, subjectSearch]);

    // Global staff filter (for the global staff search bar overview, not per-row)
    const filteredStaffOverview = useMemo(() => {
        const q = staffSearch.trim().toLowerCase();
        if (!q) return teachers;
        return teachers.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.employee_id.toLowerCase().includes(q) ||
            (t.designation || "").toLowerCase().includes(q)
        );
    }, [teachers, staffSearch]);

    // Per-row dropdown staff filter
    const getRowTeachers = useCallback(() => {
        const q = staffDropdownSearch.trim().toLowerCase();
        if (!q) return teachers;
        return teachers.filter(t =>
            t.name.toLowerCase().includes(q) || t.employee_id.toLowerCase().includes(q)
        );
    }, [teachers, staffDropdownSearch]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleAssign = (subjectId, teacherId) => {
        setSaved(false);
        setAssignments(prev => ({ ...prev, [subjectId]: teacherId }));
    };

    const handleEditRow = (subjectId) => {
        setEditingRow(subjectId);
        setStaffDropdownSearch("");
    };

    const handleCloseEdit = () => {
        setEditingRow(null);
        setStaffDropdownSearch("");
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            await apiClient.post("/section-assignments/bulk-save", {
                department: context.department,
                academic_year: context.academic_year,
                semester: context.semester,
                section_name: context.section,
                assignments: subjects.map(row => ({
                    subject_id: row.subject.id,
                    teacher_id: assignments[row.subject.id] || null,
                })),
            });
            setSaved(true);
        } catch {
            setError("Failed to save assignments. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="rounded-3xl neu-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Loading subjects & staff…</p>
            </div>
        );
    }

    const rowTeachers = getRowTeachers();

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Header card ──────────────────────────────────────────────── */}
            <div className="rounded-3xl neu-card p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                            <Users2 className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Step 1 — Assign Teachers to Subjects</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                Section <span className="font-black text-indigo-600">{context.section}</span>
                                &nbsp;·&nbsp;{context.department}
                                &nbsp;·&nbsp;Sem {context.semester}
                                &nbsp;·&nbsp;{context.academic_year}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Progress pill */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border
                            ${allAssigned
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                            {allAssigned
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <AlertCircle className="w-3.5 h-3.5" />}
                            {assignedCount}/{totalCount} assigned
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold neu-btn text-slate-700 rounded-2xl"
                        >
                            {saving
                                ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                : saved
                                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    : <Save className="w-3.5 h-3.5 text-sky-600" />}
                            {saving ? "Saving…" : saved ? "Saved!" : "Save Assignments"}
                        </button>

                        <button
                            onClick={onProceed}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-colors"
                        >
                            Configure Grid <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">{error}</div>
                )}
                {saved && !error && (
                    <div className="mt-4 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Assignments saved successfully!
                    </div>
                )}
            </div>

            {/* ── Search bar row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search subjects…"
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl neu-input text-slate-700 focus:outline-none placeholder:text-slate-400"
                    />
                    {subjectSearch && (
                        <button onClick={() => setSubjectSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                {/* Staff overview search (shows a staff badge strip below if filtered) */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search staff by name or ID…"
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl neu-input text-slate-700 focus:outline-none placeholder:text-slate-400"
                    />
                    {staffSearch && (
                        <button onClick={() => setStaffSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Staff overview strip when global search is active */}
            {staffSearch && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Staff matching "{staffSearch}" ({filteredStaffOverview.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {filteredStaffOverview.length === 0 ? (
                            <span className="text-xs text-slate-400">No staff found</span>
                        ) : (
                            filteredStaffOverview.map(t => (
                                <div key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                                    <User className="w-3 h-3 text-indigo-400" />
                                    {t.name}
                                    <span className="text-[10px] text-slate-400">({t.employee_id})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Assignment Table ──────────────────────────────────────────── */}
            <div className="rounded-3xl neu-card overflow-hidden">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Assigned Teacher</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredSubjects.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-semibold">
                                    {subjectSearch ? `No subjects match "${subjectSearch}"` : "No active subjects found. Add subjects first."}
                                </td>
                            </tr>
                        ) : (
                            filteredSubjects.map(({ subject }) => {
                                const assignedId = assignments[subject.id];
                                const assignedTeacher = teachers.find(t => t.id === assignedId);
                                const isEditing = editingRow === subject.id;

                                return (
                                    <tr key={subject.id} className={`transition-colors ${isEditing ? "bg-violet-50/40" : "hover:bg-slate-50/60"}`}>

                                        {/* Code */}
                                        <td className="font-bold text-indigo-600">{subject.subject_code}</td>

                                        {/* Subject name */}
                                        <td>
                                            <div className="font-semibold text-slate-800">{subject.subject_name}</div>
                                            {subject.subject_title && (
                                                <div className="text-[10px] text-slate-500">({subject.subject_title})</div>
                                            )}
                                        </td>

                                        {/* Type badge */}
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize
                                                ${subject.subject_type === "theory"
                                                    ? "bg-sky-50 text-sky-600 border border-sky-100"
                                                    : subject.subject_type === "practical" || subject.subject_type === "laboratory"
                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                        : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                                {subject.subject_type}
                                            </span>
                                        </td>

                                        {/* Teacher — view vs edit */}
                                        <td>
                                            {isEditing ? (
                                                <div className="space-y-1.5">
                                                    {/* per-row staff search */}
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="Search staff…"
                                                            value={staffDropdownSearch}
                                                            onChange={e => setStaffDropdownSearch(e.target.value)}
                                                            className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl neu-input text-slate-700 focus:outline-none placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                    <select
                                                        value={assignedId || ""}
                                                        onChange={e => handleAssign(subject.id, e.target.value)}
                                                        className="w-full max-w-xs rounded-xl neu-input px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                                                        size={Math.min(rowTeachers.length + 1, 6)}
                                                    >
                                                        <option value="">— Unassigned —</option>
                                                        {rowTeachers.map(t => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name} ({t.employee_id}){t.designation ? ` · ${t.designation}` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {assignedTeacher ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <User className="w-3 h-3 text-indigo-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-800">{assignedTeacher.name}</div>
                                                                <div className="text-[10px] text-slate-400">{assignedTeacher.employee_id}</div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic font-medium">— Not assigned —</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            {isEditing ? (
                                                <button
                                                    onClick={handleCloseEdit}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                    Done
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditRow(subject.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 transition-colors"
                                                    title="Edit assignment"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom action bar */}
            <div className="flex justify-end gap-3 pb-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold neu-btn text-slate-700 rounded-2xl"
                >
                    {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-sky-600" />}
                    {saving ? "Saving…" : "Save All Assignments"}
                </button>
                <button
                    onClick={onProceed}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-colors"
                >
                    Proceed to Grid <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
