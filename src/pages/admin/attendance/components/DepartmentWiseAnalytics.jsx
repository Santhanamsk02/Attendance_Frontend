import React, { useEffect, useState } from 'react';
import { getDepartmentsReport } from '../../../../services/attendanceAdminDashboardService';
import { Building2 } from 'lucide-react';

export default function DepartmentWiseAnalytics({ filters }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getDepartmentsReport(filters).then(res => {
            if (isMounted) { setData(res); setLoading(false); }
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false };
    }, [filters]);

    if (loading) return <div className="h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl animate-pulse">Loading Department Analytics...</div>;
    if (!data.length) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-800">Department Performance</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-2">
                {data.map((dept) => (
                    <div key={dept.departmentId} className="flex-none w-64 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                        <p className="font-bold text-slate-700 truncate" title={dept.departmentName}>{dept.departmentName}</p>
                        <p className="text-xs text-slate-500 mb-3">{dept.sessions} Sessions Organized</p>

                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-indigo-600">{dept.attendancePct}%</span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full rounded-full ${dept.attendancePct >= 80 ? 'bg-emerald-500' : dept.attendancePct >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${dept.attendancePct}%` }} />
                        </div>

                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                            <span>Present: <strong className="text-emerald-600">{dept.present}</strong></span>
                            <span>Absent: <strong className="text-rose-600">{dept.absent}</strong></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
