import React, { useEffect, useState, useCallback } from "react";
import { Loader, BookOpen, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api";
import { getSubjectPalette } from "../../utils/subjectColors";

function getInitials(name = "") {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

/**
 * Premium draggable Subject Palette.
 * Each card color is derived from the subject code — the same subject always gets the same color,
 * matching what it shows in the timetable grid.
 */
export default function SubjectPalette({ context }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        if (!context?.department || !context?.section) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get("/section-assignments/", {
                params: {
                    department: context.department,
                    academic_year: context.academic_year,
                    semester: context.semester,
                    section_name: context.section,
                },
            });
            setItems(res.data);
        } catch {
            setError("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    }, [context?.department, context?.academic_year, context?.semester, context?.section]);

    useEffect(() => { load(); }, [load]);

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
            subject_id: item.subject.id,
            subject_code: item.subject.subject_code,
            subject_name: item.subject.subject_name,
            subject_type: item.subject.subject_type,
            teacher_id: item.teacher?.id || null,
            teacher_name: item.teacher?.name || "",
        }));
        e.dataTransfer.effectAllowed = "copy";
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400">
            <Loader className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="text-[10px] font-semibold">Loading…</span>
        </div>
    );

    if (error) return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
    );

    const validItems = items.filter(item => item.teacher && item.teacher.id);

    if (validItems.length === 0) return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-2">
            <BookOpen className="w-8 h-8 text-slate-200" />
            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                No teachers assigned.<br />Please complete Step 1 first.
            </p>
        </div>
    );

    return (
        <div className="space-y-2">
            {validItems.map(({ subject, teacher }) => {
                const pal = getSubjectPalette(subject.subject_code);
                const initials = getInitials(teacher?.name);

                return (
                    <div
                        key={subject.id}
                        draggable
                        onDragStart={e => handleDragStart(e, { subject, teacher })}
                        title={`Drag to assign: ${subject.subject_name}`}
                        className={`
                            group relative rounded-2xl border ${pal.light}
                            cursor-grab active:cursor-grabbing select-none
                            transition-all duration-200
                            hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]
                            active:scale-[0.97] active:shadow-sm active:opacity-80
                            overflow-hidden
                        `}
                    >
                        {/* Gradient left-accent bar — matches cell color */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                            style={{ background: `linear-gradient(to bottom, ${pal.accent}, ${pal.accent}88)` }}
                        />

                        <div className="pl-3.5 pr-3 py-2.5">
                            {/* Code + type badge */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-[11px] font-black tracking-wide ${pal.text}`}>
                                    {subject.subject_code}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${pal.badge}`}>
                                    {subject.subject_type}
                                </span>
                            </div>

                            {/* Subject name */}
                            <div className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 mb-2">
                                {subject.subject_name}
                            </div>

                            {/* Teacher avatar + name */}
                            <div className="flex items-center gap-1.5">
                                {teacher ? (
                                    <>
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                                            style={{ background: `linear-gradient(135deg, ${pal.accent}, ${pal.accent}99)` }}
                                        >
                                            <span className="text-[7px] font-black text-white">{initials}</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-600 truncate">
                                            {teacher.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-400 italic">No teacher</span>
                                )}
                            </div>
                        </div>

                        {/* Drag-grip dots (visible on hover) */}
                        <div className="absolute inset-0 flex items-center justify-end pr-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-0.5">
                                        <div className={`w-1 h-1 rounded-full ${pal.dot} opacity-50`} />
                                        <div className={`w-1 h-1 rounded-full ${pal.dot} opacity-50`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
