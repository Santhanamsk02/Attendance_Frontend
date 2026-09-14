import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, ShieldCheck, ShieldAlert, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function TeacherHeader({ onMenuClick }) {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Checking verification status strictly from session storage
    const isVerified = !!sessionStorage.getItem('teacher_verification_token');

    const getPageTitle = () => {
        switch (location.pathname) {
            case "/teacher/dashboard":
                return "Teacher Dashboard";
            case "/teacher/timetable":
                return "My Timetable";
            case "/teacher/today":
                return "Today's Classes";
            case "/teacher/attendance":
                return "Take Attendance";
            case "/teacher/attendance-history":
                return "Attendance History";
            case "/teacher/subjects":
                return "My Subjects";
            case "/teacher/sections":
                return "My Sections";
            case "/teacher/profile":
                return "Teacher Profile";
            case "/teacher/notifications":
                return "Notifications";
            default:
                if (location.pathname.includes('/teacher/attendance-history/')) {
                    return "Session Details";
                }
                return "Dashboard";
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white/75 px-4 sm:px-6 backdrop-blur-xl shadow-[0_4px_20px_rgba(166,185,215,0.25)] border-b border-white/90">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-2xl text-slate-500 bg-white shadow-sm border border-slate-100 hover:text-emerald-600 transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Page Title & Breadcrumb */}
                <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <span>Teacher</span>
                        <span>/</span>
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-extrabold">
                            {getPageTitle()}
                        </span>
                    </div>
                    <h1 className="text-base sm:text-lg font-black text-slate-800 leading-none mt-0.5 tracking-tight">
                        {getPageTitle()}
                    </h1>
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 sm:gap-4">

                {/* Verification Status Badge */}
                {isVerified ? (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Faculty</span>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Verification Required</span>
                    </div>
                )}

                {/* Notification Icon */}
                <button className="relative p-2.5 rounded-2xl text-slate-500 bg-white shadow-sm border border-slate-100 hover:text-emerald-600 transition-all">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-emerald-500 to-teal-500"></span>
                    </span>
                </button>

                {/* Download App Button */}
                <a
                    href="https://drive.google.com/file/d/1udaCYSF3MJnFp7IuwNnDMCb_OFLOuQ2k/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:px-3 sm:py-2 rounded-2xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    title="Download Android App"
                >
                    <Smartphone className="w-4 h-4" />
                    <span className="hidden sm:inline">Get App</span>
                </a>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="p-2 sm:px-3 sm:py-2 rounded-2xl text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Profile Avatar */}
                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-200/50">
                        {user?.name?.substring(0, 2).toUpperCase() || "FA"}
                    </div>
                    <div className="hidden sm:block text-left max-w-[130px]">
                        <span className="block text-xs font-black text-slate-800 leading-tight truncate">
                            {user?.name || "Faculty Member"}
                        </span>
                        <span className="block text-[11px] text-emerald-600 font-bold tracking-tight truncate">
                            {user?.employee_id || "Teacher"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
