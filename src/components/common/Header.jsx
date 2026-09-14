import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, Calendar, Sparkles, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";


export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { user, logout, role } = useAuth();


  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Admin Dashboard";
      case "/students":
        return "Student Directory";
      case "/teachers":
        return "Teacher Management";
      case "/subjects":
        return "Subject Catalog";
      case "/timetable":
        return "Timetable Schedules";
      case "/attendance":
        return "Attendance Registry";
      case "/reports":
        return "Attendance Reports";
      case "/settings":
        return "System Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white/75 px-4 sm:px-6 backdrop-blur-xl shadow-[0_4px_20px_rgba(166,185,215,0.25)] border-b border-white/90">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-2xl text-slate-500 neu-btn hover:text-sky-600 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent font-extrabold">
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

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 sm:px-3 sm:py-2 rounded-2xl text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all font-bold text-xs flex items-center gap-1.5"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-[2px_2px_10px_rgba(99,102,241,0.35)]">
            {user?.name?.substring(0, 2).toUpperCase() || "US"}
          </div>
          <div className="hidden sm:block text-left max-w-[120px]">
            <span className="block text-xs font-black text-slate-800 leading-tight truncate">
              {user?.name || "User"}
            </span>
            <span className="block text-[11px] text-violet-600 font-bold capitalize truncate">
              {role === "admin" ? "College Admin" : "Teacher"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
