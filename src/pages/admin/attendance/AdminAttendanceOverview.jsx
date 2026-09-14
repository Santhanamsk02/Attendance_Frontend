import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, CheckCircle, XCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getOverview } from '../../../services/attendanceAdminDashboardService';
import DateWiseCalendarAnalytics from './components/DateWiseCalendarAnalytics';
import SubjectWiseAnalytics from './components/SubjectWiseAnalytics';
import TeacherWiseAnalytics from './components/TeacherWiseAnalytics';
import DepartmentWiseAnalytics from './components/DepartmentWiseAnalytics';
import SectionWiseAnalytics from './components/SectionWiseAnalytics';

export default function AdminAttendanceOverview() {
    const { filters } = useOutletContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getOverview(filters)
            .then(res => {
                if (isMounted) {
                    setData(res);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false };
    }, [filters]);

    if (loading) return <div className="flex justify-center py-20 text-indigo-500"><div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>Loading Dashboard...</div></div>;

    if (!data) return <div className="text-center py-20 text-slate-500">Failed to load data.</div>;

    const kpis = data.kpis || {};
    const trend = data.trend || [];
    const distribution = data.distribution || [];

    const stats = [
        { title: 'Total Students', value: kpis.totalStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'Overall Attendance', value: `${kpis.overallAttendance}%`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { title: 'Present', value: kpis.present, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { title: 'Absent', value: kpis.absent, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        { title: 'Sessions', value: kpis.sessions, icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    const COLORS = ['#10b981', '#f43f5e'];

    return (
        <div className="space-y-6">
            {/* KPI Cards (Neumorphic Style) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03),-2px_-2px_10px_rgba(255,255,255,1)] hover:shadow-[4px_4px_16px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,1)] transition-all flex flex-col gap-3">
                            <div className={`p-2 w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.title}</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Attendance Trend</h2>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                    formatter={(value, name) => [name === 'attendancePct' ? `${value}%` : value, name === 'attendancePct' ? 'Attendance' : name]}
                                />
                                <Area type="monotone" dataKey="attendancePct" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Distribution</h2>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-800">{kpis.overallAttendance}%</span>
                            <span className="text-xs text-slate-500">Overall</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Year & Semester Grid Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)]">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Year-wise Attendance</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {(data.yearWise || []).map((yw, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                                <p className="text-sm font-semibold text-slate-600">{yw.year}</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-2">{yw.attendancePct}%</p>
                                <div className="mt-3 flex justify-between text-xs text-slate-500">
                                    <span>P: {yw.present}</span>
                                    <span>A: {yw.absent}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)]">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Semester-wise Top View</h2>
                    <div className="h-64 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {(data.semesterWise || []).map((sw, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-700">Semester {sw.semester}</p>
                                    <p className="text-xs text-slate-400">{sw.students} Students • {sw.sessions} Sessions</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">{sw.attendancePct}%</p>
                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${sw.attendancePct}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Granular Analytical Modules */}
            <DateWiseCalendarAnalytics filters={filters} trendData={trend} />
            <DepartmentWiseAnalytics filters={filters} />
            <SectionWiseAnalytics filters={filters} />
            <SubjectWiseAnalytics filters={filters} />
            <TeacherWiseAnalytics filters={filters} />
        </div>
    );
}
