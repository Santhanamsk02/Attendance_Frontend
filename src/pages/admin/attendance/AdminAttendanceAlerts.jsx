import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, UserX } from 'lucide-react';
import { getAlerts, getSubjects } from '../../../services/attendanceAdminDashboardService';

export default function AdminAttendanceAlerts() {
    const { filters } = useOutletContext();
    const [alerts, setAlerts] = useState({ items: [], total: 0 });
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(75);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getAlerts(filters, threshold, 1, 50),
            getSubjects(filters)
        ]).then(([alertsRes, subjRes]) => {
            setAlerts(alertsRes);
            setSubjects(subjRes);
        }).finally(() => setLoading(false));
    }, [filters, threshold]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                    Action Required
                </h2>

                <div className="flex items-center gap-2 text-sm bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <span className="pl-3 text-slate-500 font-medium">Threshold:</span>
                    {[75, 80, 85].map(t => (
                        <button
                            key={t}
                            onClick={() => setThreshold(t)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${threshold === t ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            &lt; {t}%
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Defaulter Students List */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/30 rounded-t-2xl">
                        <h3 className="font-semibold text-slate-800">Low Attendance Students</h3>
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">{alerts.total} students</span>
                    </div>

                    <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar p-2">
                        {loading ? (
                            <div className="flex justify-center p-10"><div className="w-5 h-5 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : alerts.items.length === 0 ? (
                            <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                                <UserX className="w-12 h-12 mb-3 opacity-20" />
                                <p>No students below {threshold}%.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alerts.items.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800">{s.name}</span>
                                            <span className="text-xs font-medium text-slate-500">{s.rollNo} • Year {s.year} • Sem {s.semester} • Sec {s.section}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${s.attendancePct < 50 ? 'text-rose-600' : 'text-amber-500'}`}>{s.attendancePct}%</span>
                                                <span className="text-xs text-slate-400">{s.present}/{s.present + s.absent} cl</span>
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${s.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {s.riskLevel} Risk
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Subject Wise Performance */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Subject Performance</h3>
                    </div>
                    <div className="p-5 space-y-5 overflow-auto max-h-[600px] custom-scrollbar">
                        {loading ? (
                            <div className="w-full flex justify-center"><div className="w-4 h-4 bg-slate-300 rounded-full animate-ping"></div></div>
                        ) : subjects.length === 0 ? (
                            <p className="text-center text-sm text-slate-500">No subject data found.</p>
                        ) : (
                            subjects.map(sub => (
                                <div key={sub.subjectCode} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700 line-clamp-1 flex-1 pr-2">{sub.subjectName}</span>
                                        <span className={`font-bold shrink-0 ${sub.attendancePct < threshold ? 'text-rose-500' : 'text-emerald-500'}`}>{sub.attendancePct}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div className={`h-full rounded-full ${sub.attendancePct < threshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${sub.attendancePct}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">{sub.sessions} sessions • {sub.subjectCode}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
