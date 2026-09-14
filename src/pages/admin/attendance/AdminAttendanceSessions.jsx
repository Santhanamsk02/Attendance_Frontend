import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Eye, Filter, Download } from 'lucide-react';
import { getSessions } from '../../../services/attendanceAdminDashboardService';
import SessionDrawer from './components/SessionDrawer';

export default function AdminAttendanceSessions() {
    const { filters } = useOutletContext();
    const [data, setData] = useState({ items: [], total: 0, page: 1 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Drawer state
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openDrawer = (id) => {
        setSelectedSessionId(id);
        setIsDrawerOpen(true);
    };

    useEffect(() => {
        setLoading(true);
        getSessions(filters, page)
            .then(res => setData(res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [filters, page]);

    const getStatusColor = (pct) => {
        if (pct >= 85) return 'bg-emerald-500';
        if (pct >= 75) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Recent Sessions</h2>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Date & Period</th>
                                <th>Subject & Teacher</th>
                                <th>Section</th>
                                <th>Attendance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse"></div>
                                            Loading sessions...
                                        </div>
                                    </td>
                                </tr>
                            ) : data.items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No sessions found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                data.items.map(session => (
                                    <tr key={session.id} onClick={() => openDrawer(session.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group/row relative">
                                        <td className="relative">
                                            <div className="font-medium text-slate-800">{session.date}</div>
                                            <div className="text-xs text-slate-500">Period {session.period}</div>
                                        </td>
                                        <td>
                                            <div className="font-medium text-slate-800">{session.subjectName}</div>
                                            <div className="text-xs text-slate-500">{session.subjectCode} • {session.teacherName}</div>
                                        </td>
                                        <td>
                                            {session.section}
                                        </td>
                                        <td>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="flex w-full justify-between text-xs font-medium">
                                                    <span className="text-slate-700">{session.attendancePct}%</span>
                                                    <span className="text-slate-500">{session.present}/{session.students}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getStatusColor(session.attendancePct)}`} style={{ width: `${session.attendancePct}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {data.total > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600 bg-slate-50/30">
                        <div>Showing <span className="font-medium text-slate-800">{(page - 1) * 20 + 1}</span> to <span className="font-medium text-slate-800">{Math.min(page * 20, data.total)}</span> of <span className="font-medium text-slate-800">{data.total}</span> sessions</div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium transition-colors"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 20 >= data.total}
                                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SessionDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                sessionId={selectedSessionId}
            />
        </div>
    );
}
