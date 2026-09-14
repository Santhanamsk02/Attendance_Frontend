import React from "react";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function RecentSubjectsTable({ subjects, isLoading }) {
    if (isLoading) {
        return (
            <div className="rounded-3xl neu-card p-6">
                <h3 className="text-sm font-black text-slate-800 mb-4 px-2">Recent Subjects</h3>
                <div className="flex justify-center p-6 text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl neu-card overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    Recently Added Subjects
                </h3>
                <Link
                    to="/subjects"
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-700 hover:underline transition-all"
                >
                    View Directory &rarr;
                </Link>
            </div>

            {(!subjects || subjects.length === 0) ? (
                <div className="p-8 text-center bg-slate-50/50">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-500">No subjects found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Subject Name</th>
                                <th>Dept</th>
                                <th>Sem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subjects.map((subj) => (
                                <tr key={subj.id} className="hover:bg-violet-50/30 transition-colors">
                                    <td className="font-bold text-violet-600">{subj.subject_code}</td>
                                    <td>
                                        <div className="font-semibold text-slate-800">{subj.subject_name}</div>
                                        {subj.subject_title && (
                                            <div className="text-[10px] text-slate-500 font-semibold capitalize">({subj.subject_title})</div>
                                        )}
                                    </td>
                                    <td className="font-medium">{subj.department?.code || subj.department_id}</td>
                                    <td className="font-bold">{subj.semester}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
