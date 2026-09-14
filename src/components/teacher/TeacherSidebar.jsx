import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarDays,
    CalendarClock,
    QrCode,
    History,
    BookOpen,
    Users,
    Bell,
    User,
    X,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "My Timetable", path: "/teacher/timetable", icon: CalendarDays },
    { name: "Today's Classes", path: "/teacher/today", icon: CalendarClock },
    { name: "Take Attendance", path: "/teacher/attendance", icon: QrCode },
    { name: "Attendance History", path: "/teacher/attendance-history", icon: History },
    { name: "My Subjects", path: "/teacher/subjects", icon: BookOpen },
    { name: "My Sections", path: "/teacher/sections", icon: Users },
    { name: "Notifications", path: "/teacher/notifications", icon: Bell },
    { name: "Profile", path: "/teacher/profile", icon: User },
];

export default function TeacherSidebar({ isOpen, onClose, onCollapsedChange }) {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        if (onCollapsedChange) onCollapsedChange(next);
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/90 backdrop-blur-2xl border-r border-slate-200/60 shadow-[6px_0_24px_rgba(16,185,129,0.1)] transition-all duration-300 ease-in-out
                    ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <div className={`flex h-16 items-center border-b border-slate-200/50 bg-white/50 transition-all duration-300
                    ${collapsed ? "justify-center px-0" : "justify-between px-6"}`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-shrink-0 h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md shadow-emerald-200/50">
                            <BadgeCheck className="h-5 w-5" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <span className="block text-sm font-black text-slate-800 tracking-tight leading-tight whitespace-nowrap">
                                    Faculty Portal
                                </span>
                                <span className="block text-[10px] uppercase tracking-wider text-emerald-600 font-black whitespace-nowrap">
                                    {user?.employee_id || "Teacher"}
                                </span>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 bg-white shadow-sm border border-slate-100 hover:text-rose-500 lg:hidden transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-5 space-y-1.5 px-2">
                    {!collapsed && (
                        <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Teaching & Workload
                        </div>
                    )}

                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                title={collapsed ? item.name : undefined}
                                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                className={({ isActive }) =>
                                    `flex items-center rounded-2xl text-xs font-bold transition-all
                                    ${collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"}
                                    ${isActive
                                        ? "bg-gradient-to-r from-emerald-50 via-teal-50/50 to-cyan-50/10 text-emerald-700 shadow-sm border border-emerald-100/50"
                                        : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50 border border-transparent"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
                                            <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                                            {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                        </div>
                                        {!collapsed && isActive && (
                                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Floating collapse tab on the right edge */}
                <button
                    onClick={toggleCollapse}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50
                        w-7 h-14 items-center justify-center
                        bg-white border border-slate-200/80
                        rounded-r-xl shadow-[3px_0_12px_rgba(16,185,129,0.15)]
                        text-slate-400 hover:text-emerald-600 hover:bg-emerald-50
                        transition-all duration-200 group"
                >
                    {collapsed
                        ? <ChevronRight className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        : <ChevronLeft className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    }
                </button>
            </aside>
        </>
    );
}
