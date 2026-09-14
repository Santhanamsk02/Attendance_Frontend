import React, { useEffect, useState } from 'react';
import { getTeachersReport } from '../../../../services/attendanceAdminDashboardService';
import { GraduationCap } from 'lucide-react';

export default function TeacherWiseAnalytics({ filters }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getTeachersReport(filters).then(res => {
            if (isMounted) { setData(res); setLoading(false); }
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false };
    }, [filters]);

    if (loading) return <div className="h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl animate-pulse">Loading Faculty Analytics...</div>;
    if (!data.length) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] mt-6">
            <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-800">Faculty Attendance Activity</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Subjects Covered</th>
                            <th>Sessions</th>
                            <th>Avg Attendance</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {data.slice(0, 10).map((teacher) => ( // Top 10 for dashboard preview
                            <tr key={teacher.teacherId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="font-medium">{teacher.teacherName}</td>
                                <td className="truncate max-w-xs" title={teacher.subjectsCovered.join(', ')}>
                                    {teacher.subjectsCovered.map(s => <span key={s} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">{s}</span>)}
                                </td>
                                <td className="text-center font-semibold">{teacher.sessions}</td>
                                <td>
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className={`font-bold ${teacher.attendancePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{teacher.attendancePct}%</span>
                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                            <div className={`h-full rounded-full ${teacher.attendancePct >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${teacher.attendancePct}%` }} />
                                        </div>
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
