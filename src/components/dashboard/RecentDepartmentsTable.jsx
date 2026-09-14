import React from 'react';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentDepartmentsTable({ departments = [], isLoading }) {
    // Sort departments by ID descending (or simply reverse to fake 'recently added' if no timestamp is present)
    // We'll reverse the array since backend doesn't sort by created_at.
    const displayDepts = [...departments].reverse().slice(0, 5);

    return (
        <div className="rounded-3xl neu-card bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-indigo-50/60 bg-gradient-to-r from-sky-50/40 to-transparent">
                <div className="w-10 h-10 rounded-2xl bg-white text-indigo-500 shadow-sm border border-indigo-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Recent Departments</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Latest branches added to architecture</p>
                </div>
                <Link to="/institution" className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                    View All
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Department Name</th>
                            <th>Code</th>
                            <th>Batches</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                                    </div>
                                </td>
                            </tr>
                        ) : displayDepts.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-xs font-semibold text-slate-400 italic">No departments currently established.</td>
                            </tr>
                        ) : (
                            displayDepts.map((d) => (
                                <tr key={d.id} className="hover:bg-sky-50/30 transition-colors group">
                                    <td>
                                        <div className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{d.name}</div>
                                    </td>
                                    <td className="hidden sm:table-cell">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">{d.code}</span>
                                    </td>
                                    <td className="text-right">
                                        <span className="text-[11px] font-black w-7 h-7 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 shadow-sm">{d.batches?.length || 0}</span>
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
