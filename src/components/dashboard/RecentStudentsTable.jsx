import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UserCheck, UserX } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export default function RecentStudentsTable({ students = [], isLoading = false }) {
  return (
    <div className="rounded-3xl neu-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100/80 bg-white/40">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Recently Added Students</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Latest registrations in the system</p>
        </div>
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-black text-violet-600 hover:text-violet-700 transition-colors"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Department</th>
              <th>Class</th>
              <th>Status</th>
              <th>Added On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td><div className="h-4 w-28 bg-slate-200 rounded-lg"></div></td>
                  <td><div className="h-4 w-28 bg-slate-200 rounded-lg"></div></td>
                  <td><div className="h-4 w-24 bg-slate-100 rounded-lg"></div></td>
                  <td><div className="h-4 w-12 bg-slate-100 rounded-lg"></div></td>
                  <td><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                  <td><div className="h-4 w-20 bg-slate-100 rounded-lg"></div></td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                  No students recorded yet.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-violet-50/30 transition-colors">
                  <td className="font-mono text-xs font-bold text-sky-700">
                    <span className="px-2.5 py-1 rounded-xl neu-badge-blue">
                      {student.roll_no}
                    </span>
                  </td>
                  <td className="font-extrabold">
                    {student.name}
                  </td>
                  <td className="text-xs font-medium truncate max-w-[150px]" title={student.department?.name || student.department_id}>
                    {student.department?.name || student.department_id}
                  </td>
                  <td className="text-xs font-semibold">
                    Sem {student.semester} - {student.section}
                  </td>
                  <td>
                    {student.status === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[inset_1px_1px_2px_rgba(16,185,129,0.2)]">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-[inset_1px_1px_2px_rgba(100,116,139,0.2)]">
                        <UserX className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="text-xs font-medium">
                    {formatDate(student.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
