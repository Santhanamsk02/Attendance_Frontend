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
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white/85 px-4 sm:px-6 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-4 h-4" />
                </button>

                {/* Page Title & Breadcrumb */}
                <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <span>Teacher</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-emerald-700 font-bold">
                            {getPageTitle()}
                        </span>
                    </div>
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                        {getPageTitle()}
                    </h1>
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">

                {/* Verification Status Badge */}
                {isVerified ? (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Faculty</span>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-semibold shadow-2xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Verification Required</span>
                    </div>
                )}

                {/* Download App Button */}
                <a
                    href="https://drive.google.com/file/d/1udaCYSF3MJnFp7IuwNnDMCb_OFLOuQ2k/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                    title="Download Android App"
                >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Get App</span>
                </a>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                    title="Sign Out"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Profile Avatar */}
                <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {user?.name?.substring(0, 2).toUpperCase() || "FA"}
                    </div>
                    <div className="hidden sm:block text-left max-w-[130px]">
                        <span className="block text-xs font-bold text-slate-900 leading-tight truncate">
                            {user?.name || "Faculty Member"}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-medium tracking-tight truncate">
                            {user?.employee_id || "Teacher"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
