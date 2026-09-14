import React, { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Loader, User, BookOpen } from "lucide-react";
import Modal from "../common/Modal";
import { SESSION_TYPES } from "../../utils/constants";
import { apiClient } from "../../services/api";

export default function AssignmentModal({
    isOpen,
    onClose,
    onSave,
    onClear,
    entry = null,
    dayLabel = "",
    periodLabel = "",
    item = null,
    context = {},   // { department, academic_year, semester, section }
    timeline = [],
}) {
    const isEdit = Boolean(entry);
    const periods = timeline.filter((i) => i.type === "period");

    // ── Local form state ────────────────────────────────────────────────────
    const [subjectId, setSubjectId] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [sessionType, setSessionType] = useState("theory");
    const [room, setRoom] = useState("");
    const [startPeriodId, setStartPeriodId] = useState("");
    const [endPeriodId, setEndPeriodId] = useState("");
    const [error, setError] = useState("");

    // ── Section assignment data (subjects + their paired teacher) ───────────
    const [sectionItems, setSectionItems] = useState([]);  // [{subject, teacher}]
    const [allTeachers, setAllTeachers] = useState([]);  // all dept teachers for override
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!context?.department || !context?.section) return;
        setLoading(true);
        try {
            const [assignRes, teachersRes] = await Promise.all([
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
            setSectionItems(assignRes.data || []);
            setAllTeachers(teachersRes.data || []);
        } catch {
            setSectionItems([]);
            setAllTeachers([]);
        } finally {
            setLoading(false);
        }
    }, [context?.department, context?.academic_year, context?.semester, context?.section]);

    useEffect(() => {
        if (isOpen) loadData();
    }, [isOpen, loadData]);

    // ── Populate form when editing ──────────────────────────────────────────
    useEffect(() => {
        if (entry) {
            setSubjectId(entry.subject_id || "");
            setTeacherId(entry.teacher_id || "");
            setSessionType(entry.session_type || "theory");
            setRoom(entry.room || "");
            setStartPeriodId(entry.start_timeline_item_id || entry.timeline_item_id || "");
            setEndPeriodId(entry.end_timeline_item_id || entry.timeline_item_id || "");
        } else {
            setSubjectId("");
            setTeacherId("");
            setSessionType("theory");
            setRoom("");
            setStartPeriodId(item?.id || "");
            setEndPeriodId(item?.id || "");
        }
        setError("");
    }, [entry, isOpen, item]);

    // ── When subject changes, auto-select the paired teacher ────────────────
    const handleSubjectChange = (newSubjectId) => {
        setSubjectId(newSubjectId);
        const paired = sectionItems.find(r => r.subject.id === newSubjectId);
        if (paired?.teacher?.id) setTeacherId(paired.teacher.id);
        else setTeacherId("");
    };

    // ── Derived helpers ─────────────────────────────────────────────────────
    const isLab = sessionType === "laboratory";

    const selectedSubject = sectionItems.find(r => r.subject.id === subjectId)?.subject
        || null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subjectId) { setError("Please select a subject."); return; }
        if (!teacherId) { setError("Please select a teacher."); return; }

        const subject = sectionItems.find(r => r.subject.id === subjectId)?.subject;
        const teacher = allTeachers.find(t => t.id === teacherId);

        if (isLab && startPeriodId && endPeriodId) {
            const si = periods.findIndex(p => p.id === startPeriodId);
            const ei = periods.findIndex(p => p.id === endPeriodId);
            if (si === -1 || ei === -1 || si > ei) {
                setError("Invalid period range for laboratory."); return;
            }
            const fullStart = timeline.findIndex(i => i.id === startPeriodId);
            const fullEnd = timeline.findIndex(i => i.id === endPeriodId);
            for (let i = fullStart; i <= fullEnd; i++) {
                if (timeline[i].type === "break") {
                    setError("Laboratory cannot span across a break."); return;
                }
            }
            onSave({
                subject_id: subjectId,
                subject_code: subject?.subject_code || "",
                subject_name: subject?.subject_name || "",
                teacher_id: teacherId,
                teacher_name: teacher?.name || "",
                session_type: sessionType,
                room,
                timeline_item_id: startPeriodId,
                start_timeline_item_id: startPeriodId,
                end_timeline_item_id: endPeriodId,
                span: ei - si + 1,
            });
        } else {
            onSave({
                subject_id: subjectId,
                subject_code: subject?.subject_code || "",
                subject_name: subject?.subject_name || "",
                teacher_id: teacherId,
                teacher_name: teacher?.name || "",
                session_type: sessionType,
                room,
                timeline_item_id: startPeriodId || item?.id,
                start_timeline_item_id: startPeriodId || item?.id,
                end_timeline_item_id: startPeriodId || item?.id,
                span: 1,
            });
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Assignment" : "Assign Subject"}
            subtitle={`${dayLabel} · ${periodLabel}`}
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Loading subjects & staff…</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ── Subject ─────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            <BookOpen className="inline w-3.5 h-3.5 mr-1 text-indigo-400" />
                            Subject *
                        </label>
                        <select
                            value={subjectId}
                            onChange={(e) => handleSubjectChange(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                            <option value="">Select subject…</option>
                            {sectionItems.map(({ subject }) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.subject_code} — {subject.subject_name}
                                    {subject.subject_title ? ` (${subject.subject_title})` : ""}
                                </option>
                            ))}
                        </select>

                        {/* Selected subject detail card */}
                        {selectedSubject && (
                            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black text-indigo-700">{selectedSubject.subject_code}</div>
                                    <div className="text-[11px] font-semibold text-slate-700 truncate">{selectedSubject.subject_name}</div>
                                    {selectedSubject.subject_title && (
                                        <div className="text-[10px] text-slate-500 capitalize">({selectedSubject.subject_title})</div>
                                    )}
                                    <span className={`mt-1 inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize
                                        ${selectedSubject.subject_type === "theory"
                                            ? "bg-sky-100 text-sky-700"
                                            : "bg-violet-100 text-violet-700"}`}>
                                        {selectedSubject.subject_type}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Teacher ─────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            <User className="inline w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Teacher *
                        </label>
                        <select
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                            <option value="">Select teacher…</option>
                            {/* Paired teacher first (from section assignment) */}
                            {subjectId && sectionItems.find(r => r.subject.id === subjectId)?.teacher && (() => {
                                const paired = sectionItems.find(r => r.subject.id === subjectId).teacher;
                                return (
                                    <option key={paired.id} value={paired.id}>
                                        ★ {paired.name} ({paired.employee_id}) — assigned
                                    </option>
                                );
                            })()}
                            {/* Divider + all dept teachers */}
                            <option disabled>── All Department Staff ──</option>
                            {allTeachers.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.employee_id}){t.designation ? ` · ${t.designation}` : ""}
                                </option>
                            ))}
                        </select>
                        {subjectId && sectionItems.find(r => r.subject.id === subjectId)?.teacher && (
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                                ★ Auto-selected from section assignment
                            </p>
                        )}
                    </div>

                    {/* ── Session Type ─────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Session Type</label>
                        <select
                            value={sessionType}
                            onChange={(e) => setSessionType(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                            {SESSION_TYPES.map(st => (
                                <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Lab period range ─────────────────────────── */}
                    {isLab && (
                        <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-violet-50 border border-violet-100">
                            <div>
                                <label className="block text-[10px] font-bold text-violet-600 mb-1">Start Period *</label>
                                <select
                                    value={startPeriodId}
                                    onChange={(e) => setStartPeriodId(e.target.value)}
                                    className="w-full rounded-xl neu-input px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                                >
                                    <option value="">Select</option>
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>{p.label} ({p.start})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-violet-600 mb-1">End Period *</label>
                                <select
                                    value={endPeriodId}
                                    onChange={(e) => setEndPeriodId(e.target.value)}
                                    className="w-full rounded-xl neu-input px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                                >
                                    <option value="">Select</option>
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>{p.label} ({p.end})</option>
                                    ))}
                                </select>
                            </div>
                            {startPeriodId && endPeriodId && (() => {
                                const si = periods.findIndex(p => p.id === startPeriodId);
                                const ei = periods.findIndex(p => p.id === endPeriodId);
                                if (si >= 0 && ei >= 0 && ei >= si) {
                                    return (
                                        <p className="col-span-2 text-[10px] font-semibold text-violet-600">
                                            Periods {periods[si]?.number}–{periods[ei]?.number} will be merged ({ei - si + 1} periods)
                                        </p>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}

                    {/* ── Room ─────────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Room (optional)</label>
                        <input
                            type="text"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder="e.g. Lab 301"
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        />
                    </div>

                    {error && <p className="text-rose-500 text-xs font-semibold">{error}</p>}

                    {/* ── Actions ──────────────────────────────────── */}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            {isEdit && onClear && (
                                <button
                                    type="button"
                                    onClick={() => { onClear(); onClose(); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Clear Assignment
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 neu-btn"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isEdit ? "Update" : isLab ? "Merge & Assign" : "Assign"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
}
