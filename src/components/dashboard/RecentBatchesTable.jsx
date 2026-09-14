import React from 'react';
import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentBatchesTable({ batches = [], isLoading }) {
    // We'll reverse the array to simulate recently added Batches.
    const displayBatches = [...batches].reverse().slice(0, 5);

    return (
        <div className="rounded-3xl neu-card bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-indigo-50/60 bg-gradient-to-r from-sky-50/40 to-transparent">
                <div className="w-10 h-10 rounded-2xl bg-white text-indigo-500 shadow-sm border border-indigo-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-fuchsia-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Recent Batches</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Latest cohorts integrated</p>
                </div>
                <Link to="/institution" className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                    View All
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Batch</th>
                            <th>Timeline</th>
                            <th>Sections</th>
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
                        ) : displayBatches.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-xs font-semibold text-slate-400 italic">No batches currently established.</td>
                            </tr>
                        ) : (
                            displayBatches.map((b) => (
                                <tr key={b.id} className="hover:bg-sky-50/30 transition-colors group">
                                    <td>
                                        <div className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{b.batch_name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{b.department_name} ({b.department_code})</div>
                                    </td>
                                    <td className="hidden sm:table-cell">
                                        <span className="text-[11px] font-bold text-slate-500">
                                            Year {b.current_year} · Sem {b.current_semester}
                                        </span>
                                    </td>
                                    <td className="text-right text-[12px] font-bold text-indigo-500 tracking-widest">
                                        {Array.from({ length: Math.min(b.sections_count, 3) }).map((_, i) => String.fromCharCode(65 + i)).join(', ')}
                                        {b.sections_count > 3 && ' ...'}
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
