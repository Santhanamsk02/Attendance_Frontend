import React, { useRef, useEffect } from "react";
import { Edit2, Trash2, UserCheck, UserX, Mail, Phone } from "lucide-react";
import TableSkeleton from "../common/TableSkeleton";
import EmptyState from "../common/EmptyState";
import { getDepartmentShort } from "../../utils/formatters";

export default function TeacherTable({
    teachers = [],
    isLoading = false,
    selectedIds = [],
    onToggleSelect,
    onToggleSelectAll,
    onEdit,
    onDelete,
    onAdd,
    onImport,
    hasActiveFilters = false,
    onResetFilters,
}) {
    const headerCheckboxRef = useRef(null);

    const isAllSelected =
        teachers.length > 0 && teachers.every((t) => selectedIds.includes(t.id));
    const isPartiallySelected =
        teachers.some((t) => selectedIds.includes(t.id)) && !isAllSelected;

    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = isPartiallySelected;
        }
    }, [isPartiallySelected]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl neu-card overflow-hidden">
                <TableSkeleton rows={8} />
            </div>
        );
    }

    if (teachers.length === 0) {
        return (
            <div className="bg-white rounded-3xl neu-card p-8">
                <EmptyState
                    onAdd={onAdd}
                    onImport={onImport}
                    hasFilters={hasActiveFilters}
                    onResetFilters={onResetFilters}
                    title="No teachers found"
                    description="Add your first teacher or import teachers using CSV/XLSX."
                    addLabel="Add Teacher"
                    importLabel="Import Teachers"
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl neu-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    ref={headerCheckboxRef}
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={onToggleSelectAll}
                                    aria-label="Select all teachers on this page"
                                    className="h-4 w-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shadow-[inset_1px_1px_2px_rgba(166,185,210,0.4)]"
                                />
                            </th>
                            <th>Employee ID</th>
                            <th>Teacher Name</th>
                            <th>Contact Details</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/90">
                        {teachers.map((teacher) => {
                            const isSelected = selectedIds.includes(teacher.id);

                            return (
                                <tr
                                    key={teacher.id}
                                    onClick={() => onToggleSelect(teacher.id)}
                                    className={`transition-colors cursor-pointer group ${isSelected
                                        ? "bg-sky-50/80 text-slate-900"
                                        : "hover:bg-sky-50/30"
                                        }`}
                                >
                                    <td className="w-12  text-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleSelect(teacher.id)}
                                            aria-label={`Select teacher ${teacher.name}`}
                                            className="h-4 w-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shadow-[inset_1px_1px_2px_rgba(166,185,210,0.4)]"
                                        />
                                    </td>

                                    <td>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${isSelected
                                                ? "bg-sky-200/80 text-sky-900 shadow-[inset_1px_1px_3px_rgba(14,165,233,0.4)]"
                                                : "neu-badge-blue group-hover:shadow-[0_2px_8px_rgba(14,165,233,0.25)]"
                                                }`}
                                        >
                                            {teacher.employee_id}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="font-bold text-slate-800 leading-tight">
                                            {teacher.name}
                                        </div>
                                    </td>

                                    <td className="text-xs">
                                        <div className="space-y-0.5">
                                            {teacher.email ? (
                                                <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px] font-medium">
                                                    <Mail className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                                    <span className="truncate" title={teacher.email}>
                                                        {teacher.email}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">No email</span>
                                            )}
                                            {teacher.phone && (
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    <span>{teacher.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#f0f5fa] text-slate-700 border border-slate-200/60 shadow-[inset_1px_1px_2px_rgba(166,185,210,0.3)]"
                                            title={teacher.department?.name || teacher.department_id}
                                        >
                                            {teacher.department ? teacher.department.code : getDepartmentShort(teacher.department_id)}
                                        </span>
                                        <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                                            {teacher.department?.name || teacher.department_id}
                                        </span>
                                    </td>

                                    <td className="text-center text-xs font-semibold">
                                        {teacher.designation || "-"}
                                    </td>

                                    <td className="text-center">
                                        {teacher.status === "active" ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[inset_1px_1px_2px_rgba(16,185,129,0.2)]">
                                                <UserCheck className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-[inset_1px_1px_2px_rgba(100,116,139,0.2)]">
                                                <UserX className="w-3 h-3" /> Inactive
                                            </span>
                                        )}
                                    </td>

                                    <td className="text-right"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(teacher)}
                                                className="p-1.5 rounded-xl neu-btn text-slate-500 hover:text-sky-600"
                                                title="Edit Teacher"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(teacher)}
                                                className="p-1.5 rounded-xl neu-btn text-slate-500 hover:text-rose-600"
                                                title="Delete Teacher"
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
    );
}
