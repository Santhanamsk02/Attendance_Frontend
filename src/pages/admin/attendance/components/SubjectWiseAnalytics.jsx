import React, { useEffect, useState } from 'react';
import { getSubjects } from '../../../../services/attendanceAdminDashboardService';
import { BookOpen } from 'lucide-react';

export default function SubjectWiseAnalytics({ filters }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getSubjects(filters).then(res => {
            if (isMounted) { setData(res); setLoading(false); }
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false };
    }, [filters]);

    if (loading) return <div className="h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl animate-pulse">Loading Subject Analytics...</div>;
    if (!data.length) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] mt-6">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-800">Subject Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((subj) => (
                    <div key={subj.subjectCode} className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-slate-700 truncate" title={subj.subjectName}>{subj.subjectName}</p>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{subj.subjectCode}</p>
                            </div>
                            <span className="text-lg font-black text-indigo-600">{subj.attendancePct}%</span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full my-3 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ width: `${subj.attendancePct}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>{subj.sessions} Sessions</span>
                            <div className="flex gap-2">
                                <span className="text-emerald-600">P: {subj.present}</span>
                                <span className="text-rose-500">A: {subj.absent}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
