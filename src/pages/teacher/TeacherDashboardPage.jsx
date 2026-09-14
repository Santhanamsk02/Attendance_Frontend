import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Users, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { apiClient } from "../../services/api";

export default function TeacherDashboardPage() {
    const { user } = useAuth();
    const isVerified = !!sessionStorage.getItem('teacher_verification_token');

    // In actual implementation, these would come from standard teacher APIs
    const [stats, setStats] = useState({
        todayClassesTotal: 0,
        todayClassesCompleted: 0,
        todayClassesPending: 0,
        studentsTaughtToday: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get("/teacher/today");
                const classes = res.data.classes || [];
                const total = classes.length;
                const completed = classes.filter(c => {
                    if (c.status === 'COMPLETED') return true;
                    if (!c.time || c.time === "Unknown Time") return false;
                    const parts = c.time.split(' - ');
                    if (parts.length < 2) return false;
                    const [hours, minutes] = parts[1].split(':').map(Number);
                    const now = new Date();
                    const endTime = new Date(now);
                    endTime.setHours(hours, minutes, 0, 0);
                    return now > endTime;
                }).length;
                const pending = total - completed;

                // Actual department students dynamically calculated from the DB
                const students = res.data.department_students_count || 0;

                setStats({
                    todayClassesTotal: total,
                    todayClassesCompleted: completed,
                    todayClassesPending: pending,
                    studentsTaughtToday: students
                });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Greeting Section */}
            <div className="neu-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px] pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                            Good Morning, {user?.name || "Dr. Kumar"}
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5">
                            Here's your teaching schedule for today.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1 md:items-end bg-white/60 p-4 rounded-2xl border border-emerald-100">
                        <div className="text-xs font-bold text-slate-500">
                            Faculty ID: <span className="text-slate-800 ml-1">{user?.employee_id || "EMP001"}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            Status:
                            {isVerified ? (
                                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                            ) : (
                                <span className="text-amber-600">Verification Required</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

                <div className="neu-card rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-slate-800 leading-none">
                            {stats.todayClassesTotal}
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-600">Today's Classes</h3>
                </div>

                <div className="neu-card rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100 group-hover:scale-105 transition-transform">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-slate-800 leading-none">
                            {stats.todayClassesCompleted}
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-600">Completed</h3>
                </div>

                <div className="neu-card rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm border border-amber-100 group-hover:scale-105 transition-transform">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-slate-800 leading-none">
                            {stats.todayClassesPending}
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-600">Pending</h3>
                </div>

                <div className="neu-card rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-black text-slate-800 leading-none">
                            {stats.studentsTaughtToday}
                        </span>
                    </div>
                    <h3 className="text-base font-black text-slate-600">Students Today</h3>
                </div>

            </div>

        </div>
    );
}
