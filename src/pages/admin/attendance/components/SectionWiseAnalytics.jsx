import React, { useEffect, useState } from 'react';
import { getSectionsReport } from '../../../../services/attendanceAdminDashboardService';
import { Grid3X3 } from 'lucide-react';

export default function SectionWiseAnalytics({ filters }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getSectionsReport(filters).then(res => {
            if (isMounted) { setData(res); setLoading(false); }
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false };
    }, [filters]);

    if (loading) return <div className="h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl animate-pulse">Loading Section Analytics...</div>;
    if (!data.length) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-800">Section Performance</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.map((sec) => (
                    <div key={sec.sectionId} className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-700">Section {sec.sectionName}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sec.attendancePct >= 80 ? 'bg-emerald-100 text-emerald-700' : sec.attendancePct >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {sec.attendancePct}%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{sec.sessions} Sessions</p>
                        <div className="mt-2 text-xs flex gap-2">
                            <span className="text-emerald-600 font-medium">P: {sec.present}</span>
                            <span className="text-rose-500 font-medium">A: {sec.absent}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
