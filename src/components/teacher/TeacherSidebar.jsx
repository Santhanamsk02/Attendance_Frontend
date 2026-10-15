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
    Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "My Timetable", path: "/teacher/timetable", icon: CalendarDays },
    { name: "Today's Classes", path: "/teacher/today", icon: CalendarClock },
    { name: "Special Training", path: "/teacher/training-attendance", icon: Award },
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
                className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all duration-300 ease-in-out
                    ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <div className={`flex h-16 items-center border-b border-slate-200/80 bg-white transition-all duration-300
                    ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex flex-shrink-0 h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <BadgeCheck className="h-4 w-4" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <span className="block text-sm font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                                    Faculty Portal
                                </span>
                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold whitespace-nowrap">
                                    Teacher Suite
                                </span>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2.5">
                    {!collapsed && (
                        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Workload & Classes
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
                                    `flex items-center rounded-xl text-xs transition-all duration-150
                                    ${collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"}
                                    ${isActive
                                        ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-600 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
                                            <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                            {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                        </div>
                                        {!collapsed && isActive && (
                                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
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
                        w-7 h-12 items-center justify-center
                        bg-white border border-slate-200/90
                        rounded-r-xl shadow-xs
                        text-slate-400 hover:text-slate-700 hover:bg-slate-50
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
