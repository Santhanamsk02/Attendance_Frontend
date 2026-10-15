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
  Award,
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
      { name: "Special Training", path: "/reports/training", icon: Award },
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* ── Brand / Logo ───────────────────────────────── */}
        <div className={`flex h-16 items-center border-b border-slate-200/80 bg-white
          ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
              <QrCode className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="block text-sm font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                  AMS Portal
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold whitespace-nowrap">
                  Admin Suite
                </span>
              </div>
            )}
          </div>
          {/* Mobile close — desktop hidden */}
          {!collapsed && (
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation list ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2.5">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.isComingSoon) {
              return (
                <div
                  key={item.name}
                  title={collapsed ? item.name : `${item.name} — coming soon`}
                  className={`flex items-center rounded-xl text-xs font-medium text-slate-400 cursor-not-allowed select-none opacity-50
                    ${collapsed ? "justify-center p-2.5" : "px-3 py-2 gap-2.5"}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400">
                        Soon
                      </span>
                    </>
                  )}
                </div>
              );
            }

            const isItemActive = location.pathname.startsWith(item.path);
            
            return (
              <div key={item.name} className="space-y-0.5">
                <NavLink
                  to={item.subItems ? item.subItems[0].path : item.path}
                  title={collapsed ? item.name : undefined}
                  onClick={() => { if (window.innerWidth < 1024 && !item.subItems) onClose(); }}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-xs transition-all duration-150
                    ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-3"}
                    ${isItemActive
                      ? "bg-indigo-50/90 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold"
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isItemActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                  {!collapsed && isItemActive && !item.subItems && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                  )}
                </NavLink>

                {/* Sub Items */}
                {item.subItems && isItemActive && (
                  <div className={collapsed ? "space-y-1.5 mt-1.5 flex flex-col items-center border-t border-slate-100 pt-1.5" : "pl-9 pr-2 space-y-0.5 pt-1 mb-2 border-l border-slate-100 ml-5"}>
                    {item.subItems.map(sub => {
                      const SubIcon = sub.icon;
                      return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        title={collapsed ? sub.name : undefined}
                        onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                        className={({ isActive }) =>
                          `${collapsed ? "flex items-center justify-center p-2 rounded-lg transition-all" : "block px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"}
                          ${isActive
                            ? "bg-indigo-50/80 text-indigo-700 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`
                        }
                      >
                        {collapsed ? <SubIcon className="w-3.5 h-3.5" /> : sub.name}
                      </NavLink>
                    )})}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Floating collapse tab on the right edge ───── */}
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
