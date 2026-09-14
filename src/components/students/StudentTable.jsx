import React, { useRef, useEffect } from "react";
import { Edit2, Trash2, UserCheck, UserX, Mail, Phone } from "lucide-react";
import TableSkeleton from "../common/TableSkeleton";
import EmptyState from "../common/EmptyState";
import { getDepartmentShort } from "../../utils/formatters";

export default function StudentTable({
  students = [],
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
    students.length > 0 && students.every((s) => selectedIds.includes(s.id));
  const isPartiallySelected =
    students.some((s) => selectedIds.includes(s.id)) && !isAllSelected;

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

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl neu-card p-8">
        <EmptyState
          onAdd={onAdd}
          onImport={onImport}
          hasFilters={hasActiveFilters}
          onResetFilters={onResetFilters}
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
              {/* Select All Checkbox */}
              <th>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all students on this page"
                  className="h-4 w-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shadow-[inset_1px_1px_2px_rgba(166,185,210,0.4)]"
                />
              </th>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Contact Details</th>
              <th>Department</th>
              <th>Sem / Sec</th>
              <th>Academic Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {students.map((student) => {
              const isSelected = selectedIds.includes(student.id);

              return (
                <tr
                  key={student.id}
                  onClick={() => onToggleSelect(student.id)}
                  className={`transition-colors cursor-pointer group ${isSelected
                      ? "bg-sky-50/80 text-slate-900"
                      : "hover:bg-sky-50/30"
                    }`}
                >
                  {/* Row Checkbox */}
                  <td className="w-12  text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(student.id)}
                      aria-label={`Select student ${student.name}`}
                      className="h-4 w-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shadow-[inset_1px_1px_2px_rgba(166,185,210,0.4)]"
                    />
                  </td>

                  {/* 12-char Roll No */}
                  <td>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${isSelected
                          ? "bg-sky-200/80 text-sky-900 shadow-[inset_1px_1px_3px_rgba(14,165,233,0.4)]"
                          : "neu-badge-blue group-hover:shadow-[0_2px_8px_rgba(14,165,233,0.25)]"
                        }`}
                    >
                      {student.roll_no}
                    </span>
                  </td>

                  {/* Name */}
                  <td>
                    <div className="font-bold text-slate-800 leading-tight">
                      {student.name}
                    </div>
                  </td>

                  {/* Contact Details */}
                  <td className="text-xs">
                    <div className="space-y-0.5">
                      {student.email ? (
                        <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px] font-medium">
                          <Mail className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          <span className="truncate" title={student.email}>
                            {student.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No email</span>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Department */}
                  <td>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#f0f5fa] text-slate-700 border border-slate-200/60 shadow-[inset_1px_1px_2px_rgba(166,185,210,0.3)]"
                      title={student.department?.name || student.department_id}
                    >
                      {student.department ? student.department.code : getDepartmentShort(student.department_id)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                      {student.department?.name || student.department_id}
                    </span>
                  </td>

                  {/* Semester & Section */}
                  <td className="text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold neu-badge-blue">
                      S{student.semester} - {student.section}
                    </span>
                  </td>

                  {/* Academic Year */}
                  <td className="text-center text-xs font-semibold">
                    {student.academic_year}
                  </td>

                  {/* Status */}
                  <td className="text-center">
                    {student.status === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[inset_1px_1px_2px_rgba(16,185,129,0.2)]">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-[inset_1px_1px_2px_rgba(100,116,139,0.2)]">
                        <UserX className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(student)}
                        className="p-1.5 rounded-xl neu-btn text-slate-500 hover:text-sky-600"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(student)}
                        className="p-1.5 rounded-xl neu-btn text-slate-500 hover:text-rose-600"
                        title="Delete Student"
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
