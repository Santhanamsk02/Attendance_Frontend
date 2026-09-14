import React from "react";
import { Edit3, Trash2, BookOpen, Beaker, Award, FileText } from "lucide-react";

const TYPE_ICONS = {
    theory: <BookOpen className="w-3.5 h-3.5" />,
    laboratory: <Beaker className="w-3.5 h-3.5" />,
    practical: <Beaker className="w-3.5 h-3.5" />,
    elective: <Award className="w-3.5 h-3.5" />,
    project: <FileText className="w-3.5 h-3.5" />,
    other: <FileText className="w-3.5 h-3.5" />,
};

const TYPE_COLORS = {
    theory: "bg-blue-50 text-blue-600",
    laboratory: "bg-amber-50 text-amber-600",
    practical: "bg-emerald-50 text-emerald-600",
    elective: "bg-purple-50 text-purple-600",
    project: "bg-pink-50 text-pink-600",
    other: "bg-slate-50 text-slate-600",
};

export default function SubjectTable({
    subjects,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onEdit,
    onDelete,
    isLoading,
}) {
    if (isLoading) {
        return (
            <div className="rounded-3xl neu-card p-10 text-center mb-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-sm text-slate-500 font-semibold">Loading subjects...</p>
            </div>
        );
    }

    if (!subjects || subjects.length === 0) {
        return (
            <div className="rounded-3xl neu-card p-10 text-center mb-6">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">No subjects found.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
        );
    }

    const allSelected = subjects.length > 0 && subjects.every((s) => selectedIds.includes(s.id));

    return (
        <div className="rounded-3xl neu-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={onToggleSelectAll}
                                    className="rounded accent-indigo-500"
                                />
                            </th>
                            <th>Code</th>
                            <th>Subject Name</th>
                            <th>Department</th>
                            <th>Year</th>
                            <th>Sem</th>
                            <th>Type</th>
                            <th>Credits</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {subjects.map((subject) => (
                            <tr key={subject.id} className="hover:bg-indigo-50/20 transition-colors">
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(subject.id)}
                                        onChange={() => onToggleSelect(subject.id)}
                                        className="rounded accent-indigo-500"
                                    />
                                </td>
                                <td className="font-bold text-indigo-600">{subject.subject_code}</td>
                                <td>
                                    <div className="font-bold text-slate-800 break-words">
                                        {subject.subject_name}
                                    </div>
                                    {subject.subject_title && (
                                        <div className="text-[10px] text-slate-500 font-semibold capitalize mt-0.5">
                                            ({subject.subject_title})
                                        </div>
                                    )}
                                </td>
                                <td className="font-bold">{subject.department?.code || subject.department_id}</td>
                                <td>{subject.academic_year}</td>
                                <td className="text-center font-bold">{subject.semester}</td>
                                <td>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${TYPE_COLORS[subject.subject_type] || TYPE_COLORS.other}`}>
                                        {TYPE_ICONS[subject.subject_type] || TYPE_ICONS.other}
                                        {subject.subject_type}
                                    </span>
                                </td>
                                <td className="text-center font-semibold">
                                    {subject.credits ?? "—"}
                                </td>
                                <td className="text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${subject.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                                        {subject.status === "active" ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            onClick={() => onEdit(subject)}
                                            className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(subject)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
