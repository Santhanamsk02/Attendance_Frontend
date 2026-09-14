import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, ChevronRight, QrCode, CalendarOff, RefreshCw, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api";

export default function TeacherTodayClassesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchToday = async () => {
            try {
                const res = await apiClient.get("/teacher/today");
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch today's classes");
            } finally {
                setLoading(false);
            }
        };
        fetchToday();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading today's schedule...</div>;

    const classes = data?.classes || [];

    const checkHasStarted = (timeString) => {
        if (!timeString || timeString === "Unknown Time") return true;
        const [start] = timeString.split(' - ');
        if (!start) return true;

        const [hours, minutes] = start.split(':').map(Number);
        const now = new Date();
        const classTime = new Date(now);
        classTime.setHours(hours, minutes, 0, 0);
        return now >= classTime;
    };

    const checkHasEnded = (timeString) => {
        if (!timeString || timeString === "Unknown Time") return false;
        const parts = timeString.split(' - ');
        if (parts.length < 2) return false;

        const [hours, minutes] = parts[1].split(':').map(Number);
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(hours, minutes, 0, 0);
        return now > endTime;
    };

    const formatTime12Hour = (time24Str) => {
        if (!time24Str || time24Str === "Unknown Time") return time24Str;
        const formatSingle = (ts) => {
            if (!ts) return "";
            const [h, m] = ts.split(':');
            let hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${m} ${ampm}`;
        };

        if (time24Str.includes(' - ')) {
            const [start, end] = time24Str.split(' - ');
            return `${formatSingle(start)} - ${formatSingle(end)}`;
        }
        return formatSingle(time24Str);
    };

    const handleTakeAttendance = (cls) => {
        // Here we navigate to the attendance scanner page, which is Phase 4
        // Passing the class details as state
        navigate(`/teacher/attendance?classId=${cls.id}`, { state: { classData: cls } });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Today's Classes</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        {new Date(data?.date || new Date()).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {data?.day_type === 'HOLIDAY' && (
                    <div className="mt-4 px-4 py-3 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm border border-rose-200 flex items-center gap-3 shadow-sm">
                        <CalendarOff className="w-5 h-5 text-rose-500" />
                        System Note: Today has been declared a Holiday. All scheduled classes are cancelled.
                    </div>
                )}
                {data?.day_type === 'HALF_DAY' && (
                    <div className="mt-4 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm border border-amber-200 flex items-center gap-3 shadow-sm">
                        <Clock className="w-5 h-5 text-amber-500" />
                        System Note: Today is a Half-Day schedule. Some classes may be cancelled.
                    </div>
                )}
                {data?.day_type === 'DAY_SWAP' && (
                    <div className="mt-4 px-4 py-3 bg-sky-50 text-sky-700 rounded-xl font-bold text-sm border border-sky-200 flex items-center gap-3 shadow-sm">
                        <RefreshCw className="w-5 h-5 text-sky-500" />
                        System Note: Day Swap active. Operating on {data?.day_swap_source}'s timetable today.
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {classes.map((cls, idx) => {
                    if (cls.type === 'break') {
                        return (
                            <div key={`break-${idx}`} className="flex items-center gap-4 py-2 px-6">
                                <div className="text-xs font-black text-slate-400 font-mono w-32 text-right whitespace-nowrap">{formatTime12Hour(cls.time)}</div>
                                <div className="flex-1 border-t-2 border-dashed border-slate-200"></div>
                                <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                    {cls.title}
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-slate-200"></div>
                            </div>
                        );
                    }

                    const hasStarted = checkHasStarted(cls.time);
                    const hasEnded = checkHasEnded(cls.time);
                    const isCompleted = cls.status === 'COMPLETED';
                    const isCurrent = hasStarted && !hasEnded;

                    return (
                        <div key={cls.id} className={`neu-card p-5 md:p-6 rounded-2xl bg-white border transition-all ${isCurrent ? 'border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.01]' : 'border-slate-100 hover:shadow-md'}`}>
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">

                                {/* Time Column */}
                                <div className="flex items-center md:flex-col md:justify-center md:w-32 gap-2 md:gap-1 pl-2">
                                    {isCurrent && <span className="flex h-2 w-2 relative md:absolute md:-left-1 md:top-1/2 mt-1 md:mt-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>}
                                    <Clock className={`w-5 h-5 flex-shrink-0 ${hasStarted && !isCompleted && !hasEnded ? 'text-sky-500' : isCurrent ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className={`whitespace-nowrap text-sm font-bold font-mono ${hasStarted && !isCompleted && !hasEnded ? 'text-sky-600' : 'text-slate-600'}`}>{formatTime12Hour(cls.time)}</span>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px self-stretch bg-slate-100 mx-2"></div>

                                {/* Class Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${cls.type === 'theory' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {cls.type || "Theory"}
                                            </span>
                                            {isCompleted && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Done
                                                </span>
                                            )}
                                            {!hasStarted && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Upcoming
                                                </span>
                                            )}
                                            {cls.is_override && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 flex items-center gap-1 border border-rose-200 shadow-sm ml-2">
                                                    <AlertCircle className="w-3 h-3" /> {cls.override_label || "Override"}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Class {cls.period.replace('extra-', 'Extra ')}</span>
                                    </div>
                                    <h3 className="text-base md:text-lg font-black text-slate-800 leading-tight mb-1 truncate" title={cls.subject}>
                                        <span className="text-slate-400 mr-2 font-mono text-sm">{cls.code}</span>
                                        {cls.subject}
                                    </h3>
                                    {cls.title && <p className="text-xs md:text-sm font-bold text-slate-500 mb-2 line-clamp-1">{cls.title}</p>}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-semibold text-slate-500">
                                        <span>Section: <strong className="text-slate-700">{cls.section_display || cls.section}</strong></span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="font-mono text-slate-400">{cls.code}</span>
                                    </div>
                                </div>

                                {/* Action Column */}
                                <div className="mt-4 md:mt-0 flex flex-row md:flex-col justify-end gap-3 md:min-w-[170px]">
                                    {isCurrent ? (
                                        <button
                                            onClick={() => handleTakeAttendance(cls)}
                                            className="flex-1 md:flex-none px-4 py-3 rounded-xl font-black text-[13px] md:text-sm shadow-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200/50 hover:shadow-md hover:scale-105"
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                                            {isCompleted ? "Update Session" : "Take Attendance"}
                                        </button>
                                    ) : hasEnded ? (
                                        <button
                                            className="flex-1 md:flex-none px-4 py-3 bg-slate-50/50 text-slate-400 rounded-xl font-bold text-xs border border-slate-100/50 cursor-not-allowed justify-center flex items-center gap-2"
                                            disabled
                                        >
                                            {isCompleted ? (
                                                <><CheckCircle2 className="w-4 h-4" /> Attendance Logged</>
                                            ) : (
                                                <><Clock className="w-4 h-4" /> Class Ended</>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            className="flex-1 md:flex-none px-4 py-3 bg-indigo-50/50 text-indigo-400 rounded-xl font-bold text-[13px] border border-indigo-100/50 cursor-not-allowed justify-center flex items-center gap-2"
                                            disabled
                                        >
                                            <Clock className="w-4 h-4" />
                                            Starts at {formatTime12Hour(cls.time.split(' - ')[0])}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {classes.length === 0 && (
                    <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl neu-inset border border-slate-200/50 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg text-slate-700">No Classes Scheduled</h3>
                        <p className="mt-1">You have no teaching assignments for today.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
