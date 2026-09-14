import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { getSessions } from '../../../../services/attendanceAdminDashboardService';

export default function DateWiseCalendarAnalytics({ filters, trendData }) {
    // We expect trendData to be passed from the overview fetch mapping dates -> pct
    // Let's implement a simple grid layout for the calendar
    const [selectedDate, setSelectedDate] = useState(null);
    const [daySessions, setDaySessions] = useState([]);
    const [loadingDay, setLoadingDay] = useState(false);

    // Process trend date mapping
    const trendMap = useMemo(() => {
        const map = {};
        if (!trendData) return map;
        trendData.forEach(d => {
            map[d.date] = d; // expecting 'YYYY-MM-DD'
        });
        return map;
    }, [trendData]);

    // Calculate calendar grid (Very basic: just show the last 30 days present in the trend data)
    // Or normally, we'd render the current month. Let's do the latest month from the trend.
    const displayMonth = useMemo(() => {
        if (!trendData || trendData.length === 0) return { days: [] };

        // Find latest date in trend
        const dates = trendData.map(d => new Date(d.date)).sort((a, b) => b - a);
        const latest = dates[0];
        if (!latest) return { days: [] };

        const year = latest.getFullYear();
        const month = latest.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // padding for first day (0 = Sunday)
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            const str = d.toISOString().split('T')[0];
            days.push(str);
        }

        return {
            monthName: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' }),
            days
        };
    }, [trendData]);

    // Handle selecting a date -> Fetch the actual session table!
    const handleDateClick = async (dateStr) => {
        if (!trendMap[dateStr]) return; // empty date

        setSelectedDate(dateStr);
        setLoadingDay(true);
        try {
            // Apply current filters AND exact date filter
            const dateFilters = { ...filters, start_date: dateStr, end_date: dateStr };
            const res = await getSessions(dateFilters, 1, 100); // get all sessions on this day
            setDaySessions(res.items || []);
        } catch (e) {
            console.error(e);
            setDaySessions([]);
        } finally {
            setLoadingDay(false);
        }
    };

    if (!trendData || !trendData.length) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] mt-6">
            <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-800">Daily Attendance Tracker</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* CALENDAR */}
                <div className="lg:w-1/3 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                    <h3 className="font-bold text-slate-700 text-center mb-4">{displayMonth.monthName}</h3>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {displayMonth.days.map((dateStr, idx) => {
                            if (!dateStr) return <div key={`pad-${idx}`} className="h-8" />;

                            const dayNum = parseInt(dateStr.split('-')[2], 10);
                            const tData = trendMap[dateStr];
                            const pct = tData?.attendancePct || 0;

                            let bgClass = "bg-white border-transparent text-slate-400 hover:bg-slate-200 cursor-default";
                            let ringClass = selectedDate === dateStr ? 'ring-2 ring-indigo-500 ring-offset-1' : '';

                            if (tData) {
                                // Has sessions
                                bgClass = pct >= 80 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer font-bold border-emerald-200" :
                                    pct >= 70 ? "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer font-bold border-amber-200" :
                                        "bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer font-bold border-rose-200";
                            }

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => tData ? handleDateClick(dateStr) : null}
                                    title={tData ? `${pct}% (${tData.sessions} sessions)` : 'No sessions'}
                                    className={`h-8 flex items-center justify-center rounded-md border transition-all ${bgClass} ${ringClass}`}
                                >
                                    {dayNum}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between items-center mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                        <span className="flex gap-1 items-center"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> &gt; 80%</span>
                        <span className="flex gap-1 items-center"><div className="w-2 h-2 rounded-full bg-amber-400"></div> &gt; 70%</span>
                        <span className="flex gap-1 items-center"><div className="w-2 h-2 rounded-full bg-rose-400"></div> &lt; 70%</span>
                    </div>
                </div>

                {/* DETAILS PANE */}
                <div className="lg:w-2/3">
                    {!selectedDate ? (
                        <div className="h-full min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50">
                            <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
                            <p>Select a highlighted date on the calendar<br />to view session particulars.</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Summary Header */}
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-t-xl border border-indigo-100">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">Date Summary</p>
                                    <h3 className="text-xl font-bold text-indigo-900">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-indigo-600">{trendMap[selectedDate]?.attendancePct}%</span>
                                    <p className="text-xs text-indigo-500 font-medium">{trendMap[selectedDate]?.sessions} Sessions</p>
                                </div>
                            </div>

                            {/* Sessions List */}
                            <div className="flex-1 bg-white border border-t-0 border-slate-200 rounded-b-xl overflow-hidden shadow-sm flex flex-col">
                                {loadingDay ? (
                                    <div className="py-10 text-center text-slate-500 animate-pulse">Loading Date Sessions...</div>
                                ) : daySessions.length === 0 ? (
                                    <div className="py-10 text-center text-slate-500">No session data extracted.</div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[250px] custom-scrollbar">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Subject</th>
                                                    <th>Teacher</th>
                                                    <th><center>Att %</center></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {daySessions.map(ds => (
                                                    <tr key={ds.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="font-medium">Per. {ds.period}</td>
                                                        <td>
                                                            <p className="font-bold text-slate-800">{ds.subjectName}</p>
                                                            <p className="text-xs text-slate-400">Sec {ds.section} • {ds.students} Stdnt</p>
                                                        </td>
                                                        <td>{ds.teacherName}</td>
                                                        <td className="text-center">
                                                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${ds.attendancePct >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                {ds.attendancePct}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
