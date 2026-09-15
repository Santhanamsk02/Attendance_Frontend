import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Calendar,
  QrCode,
  BarChart3,
  X,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  UserCircle,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Institution", path: "/institution", icon: Building2 },
  { name: "Students", path: "/students", icon: Users },
  { name: "Teachers", path: "/teachers", icon: GraduationCap },
  { name: "Subjects", path: "/subjects", icon: BookOpen },
  { name: "Timetable", path: "/timetable", icon: CalendarDays },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { 
    name: "Reports", 
    path: "/reports", 
    icon: BarChart3,
    subItems: [
      { name: "Daily Register", path: "/reports/daily", icon: ClipboardList },
      { name: "Student Profile", path: "/reports/student", icon: UserCircle },
      { name: "Defaulters", path: "/reports/defaulters", icon: AlertOctagon },
    ]
  },
];


export default function Sidebar({ isOpen, onClose, onCollapsedChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onCollapsedChange) onCollapsedChange(next);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/80 backdrop-blur-2xl border-r border-white/90 shadow-[6px_0_24px_rgba(166,185,215,0.3)] transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* ── Brand / Logo ───────────────────────────────── */}
        <div className={`flex h-16 items-center border-b border-slate-200/50 bg-white/50
          ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-600 text-white shadow-[2px_2px_10px_rgba(99,102,241,0.35)]">
              <QrCode className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="block text-sm font-black text-slate-800 tracking-tight leading-tight whitespace-nowrap">
                  AMS Admin
                </span>
                <span className="block text-[10px] uppercase tracking-wider bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent font-black whitespace-nowrap">
                  College Portal
                </span>
              </div>
            )}
          </div>
          {/* Mobile close — desktop hidden */}
          {!collapsed && (
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 neu-btn hover:text-slate-600 lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation list ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {!collapsed && (
            <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Core Modules
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.isComingSoon) {
              return (
                <div
                  key={item.name}
                  title={collapsed ? item.name : `${item.name} — coming soon`}
                  className={`flex items-center rounded-2xl text-xs font-medium text-slate-400 cursor-not-allowed select-none opacity-50
                    ${collapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200/60 text-slate-400">
                        Soon
                      </span>
                    </>
                  )}
                </div>
              );
            }

            const isItemActive = location.pathname.startsWith(item.path);
            
            return (
              <div key={item.name} className="space-y-1">
                <NavLink
                  to={item.subItems ? item.subItems[0].path : item.path}
                  title={collapsed ? item.name : undefined}
                  onClick={() => { if (window.innerWidth < 1024 && !item.subItems) onClose(); }}
                  className={({ isActive }) =>
                    `flex items-center rounded-2xl text-xs font-bold transition-all
                    ${collapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"}
                    ${isItemActive
                      ? "bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 text-violet-700 shadow-[3px_3px_10px_rgba(166,185,215,0.3),-3px_-3px_10px_rgba(255,255,255,0.9)] border border-violet-200/60 font-extrabold"
                      : "text-slate-600 hover:text-violet-600 hover:bg-white/60 border border-transparent"
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isItemActive ? "text-violet-600" : "text-slate-400"}`} />
                  {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                  {!collapsed && isItemActive && !item.subItems && (
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.8)] flex-shrink-0" />
                  )}
                </NavLink>

                {/* Sub Items */}
                {item.subItems && isItemActive && (
                  <div className={collapsed ? "space-y-2 mt-2 flex flex-col items-center border-t border-slate-100 pt-2" : "pl-10 pr-2 space-y-1 pt-1 mb-2"}>
                    {item.subItems.map(sub => {
                      const SubIcon = sub.icon;
                      return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        title={collapsed ? sub.name : undefined}
                        onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                        className={({ isActive }) =>
                          `${collapsed ? "flex items-center justify-center p-2.5 rounded-xl transition-all" : "block px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors"}
                          ${isActive
                            ? (collapsed ? "bg-violet-100 text-violet-700 shadow-sm" : "bg-violet-50 text-violet-700")
                            : (collapsed ? "text-slate-400 hover:text-violet-600 hover:bg-slate-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50")
                          }`
                        }
                      >
                        {collapsed ? <SubIcon className="w-4 h-4" /> : sub.name}
                      </NavLink>
                    )})}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Floating collapse tab on the right edge ───── */}
        {/* Desktop only — sticks out from the right side of the sidebar */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50
            w-7 h-14 items-center justify-center
            bg-white border border-slate-200/80
            rounded-r-xl shadow-[3px_0_12px_rgba(166,185,215,0.35)]
            text-slate-400 hover:text-indigo-600 hover:bg-indigo-50
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
