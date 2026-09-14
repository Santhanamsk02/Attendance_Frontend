import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Activity, PieChart as PieChartIcon } from "lucide-react";
import { apiClient } from "../../../services/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

export default function StudentAttendanceDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedDates, setExpandedDates] = useState({});

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const res = await apiClient.get(`/admin/attendance/students/${studentId}/report`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch student report", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (studentId) fetchReport();
    }, [studentId]);

    const { groupedHistory, graphData, pieData, expectedDays, presentDays } = useMemo(() => {
        if (!data) return { groupedHistory: {}, graphData: [], pieData: [], expectedDays: 0, presentDays: 0 };

        // Group by Date
        const grouped = {};
        data.history.forEach(record => {
            if (!grouped[record.date]) {
                grouped[record.date] = {
                    date: record.date,
                    periods: [],
                    isDayPresent: false,
                    totalPeriods: 0,
                    presentPeriods: 0
                };
            }
            grouped[record.date].periods.push(record);
            grouped[record.date].totalPeriods += 1;
            if (record.status === "Present") {
                grouped[record.date].isDayPresent = true;
                grouped[record.date].presentPeriods += 1;
            }
        });

        const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        const sortedGrouped = dates.map(d => grouped[d]);

        // Graph Data
        const recentDates = [...dates].reverse().slice(-14); // up to 14 days trend
        const gData = recentDates.map(d => ({
            name: d.substring(5), // mm-dd
            AttendanceRate: Math.round((grouped[d].presentPeriods / grouped[d].totalPeriods) * 100),
            Present: grouped[d].isDayPresent ? 1 : 0
        }));

        const expDays = sortedGrouped.length;
        const prDays = sortedGrouped.filter(g => g.isDayPresent).length;

        const pData = [
            { name: 'Present Days', value: prDays, color: '#10b981' },
            { name: 'Absent Days', value: expDays - prDays, color: '#f43f5e' }
        ];

        return {
            groupedHistory: sortedGrouped,
            graphData: gData,
            pieData: pData,
            expectedDays: expDays,
            presentDays: prDays
        };
    }, [data]);

    const toggleDate = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold tracking-wide">Generating Full Report...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.student) {
        return <div className="p-8 text-center text-slate-500 font-medium tracking-wide">Failed to load student report.</div>;
    }

    const { student } = data;
    const overallDayAttendance = expectedDays > 0 ? Math.round((presentDays / expectedDays) * 100) : 0;

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 hover:-translate-y-0.5 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Attendance Profile</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Advanced daily tracking and overall performance analytics.</p>
                </div>
            </div>

            {/* Hero Profile Card */}
            <div className="rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 border border-slate-700/50">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 w-full">
                    <div className="shrink-0 relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-emerald-400 rounded-full flex items-center justify-center text-5xl font-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
                            <span className="text-white drop-shadow-md">{student.name.charAt(0)}</span>
                        </div>
                        <div className="absolute -bottom-2 md:-right-2 bg-emerald-500 border-[3px] border-slate-900 w-8 h-8 rounded-full shadow-lg"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl font-black mb-2 tracking-tight drop-shadow-sm">{student.name}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl font-bold text-sm tracking-wide border border-white/5">{student.roll_no}</span>
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl font-bold text-sm border border-white/5 bg-gradient-to-r from-emerald-500/20 to-sky-500/20">Class {student.section}</span>
                        </div>
                    </div>

                    <div className="shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center gap-8 shadow-inner-light">
                        <div className="text-center">
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1.5">Present</p>
                            <p className="text-4xl font-black text-emerald-400 drop-shadow-sm">{presentDays}</p>
                        </div>
                        <div className="w-px h-16 bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1.5">Expected</p>
                            <p className="text-4xl font-black text-white drop-shadow-sm">{expectedDays}</p>
                        </div>
                        <div className="w-px h-16 bg-white/10"></div>
                        <div className="text-center bg-gradient-to-b from-indigo-500/20 to-transparent px-6 py-3 rounded-2xl border border-indigo-400/20">
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Percentage</p>
                            <p className="text-3xl font-black text-indigo-100">{overallDayAttendance}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">

                {/* Analytics Section - Full Width, Line By Line style */}
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-5 flex items-center gap-2 px-2">
                        <Activity className="w-5 h-5 text-indigo-500" /> Reporting Visualizations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Pie Chart */}
                        <div className="md:col-span-1 rounded-[2rem] bg-white p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-80 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <PieChartIcon className="w-4 h-4 text-rose-400" /> Overall Spread
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-400 mb-4">Total days present vs expected.</p>
                            <div className="flex-1 min-h-0 relative">
                                {expectedDays === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs">No Data</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip cursor={false} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'rgba(0,0,0,0.1) 0 10px 20px', padding: '10px 14px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {expectedDays > 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-slate-800">{overallDayAttendance}%</span>
                                        <span className="text-[10px] font-bold text-slate-400">Total</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Line Trend Chart */}
                        <div className="md:col-span-3 rounded-[2rem] bg-white p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-80 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-emerald-400" /> Daily Attendance Pattern
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-400 mb-6">Percentage of periods attended on active days over the last 14 days.</p>
                            <div className="flex-1 min-h-0 pl-0">
                                {graphData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs">No Trend Data</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} stroke="#94a3b8" />
                                            <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'rgba(0,0,0,0.08) 0 10px 25px', padding: '12px 16px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#10b981', fontWeight: '900' }}
                                            />
                                            <Area type="monotone" dataKey="AttendanceRate" stroke="#10b981" strokeWidth={4} fill="url(#colorRate)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Day-wise History Ledger */}
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-5 flex items-center gap-2 px-2 mt-4">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Chronological Ledger
                    </h3>
                    <div className="rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-0 overflow-y-auto max-h-[800px]">
                            {groupedHistory.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm tracking-wide">No chronological data recorded.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 p-2">
                                    {groupedHistory.map((group, idx) => (
                                        <div key={idx} className="flex flex-col group/row">
                                            {/* Day Header Row */}
                                            <div
                                                className={`mx-2 my-1 px-5 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${expandedDates[group.date] ? 'bg-slate-50 border border-slate-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                                onClick={() => toggleDate(group.date)}
                                            >
                                                <div className="flex items-center gap-5">
                                                    {group.isDayPresent ? (
                                                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100/80">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-rose-100 to-rose-50 text-rose-500 flex items-center justify-center shadow-sm border border-rose-100/80">
                                                            <XCircle className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-0.5">{group.date}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                {group.presentPeriods} / {group.totalPeriods} Classes Attended
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {group.isDayPresent ? (
                                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs shadow-sm border border-emerald-100">
                                                            Day Present
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-black text-xs shadow-sm border border-rose-100">
                                                            Day Absent
                                                        </span>
                                                    )}
                                                    <button className={`p-2 rounded-xl transition-all ${expandedDates[group.date] ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' : 'text-slate-400 group-hover/row:text-slate-700 bg-transparent'}`}>
                                                        {expandedDates[group.date] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Period Drill-down */}
                                            {expandedDates[group.date] && (
                                                <div className="mx-2 mb-3 mt-1 px-6 py-5 bg-slate-50/50 rounded-b-2xl border border-slate-100 shadow-inner-light">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ArrowLeft className="w-3 h-3 text-slate-300 transform -rotate-45" /> Period Breakdown Matrix</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {group.periods.map((p, pIdx) => (
                                                            <div key={pIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between group/card hover:shadow-md transition-shadow">
                                                                <div className="flex-1 min-w-0 pr-3">
                                                                    <p className="text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                                                                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">{p.period.substring(p.period.length - 1) || p.period}</span>
                                                                        Period
                                                                    </p>
                                                                    <p className="text-[11px] font-bold text-slate-400 truncate w-full" title={p.subject_name}>{p.subject_name}</p>
                                                                </div>
                                                                {p.status === "Present" ? (
                                                                    <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 shrink-0 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                                                                        <XCircle className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
